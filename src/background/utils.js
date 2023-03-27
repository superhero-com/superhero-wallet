import { useAccounts } from '../composables';
import { IS_FIREFOX } from '../lib/environment';
import {
  CONNECTION_TYPES,
  getAddressByNameEntry,
  watchUntilTruthy,
} from '../popup/utils';
import store from './store';

const BACKEND_AE_VM = 'aevm';
const BACKEND_FATE = 'fate';

let tippingContract;

export const setContractInstance = async (tx, sdk, contractAddress = null) => {
  let contractInstance = false;
  try {
    let backend = BACKEND_FATE;
    if (typeof tx.abi_version !== 'undefined' && tx.abi_version !== 3) {
      backend = BACKEND_AE_VM;
    }
    contractInstance = await sdk.getContractInstance({
      source: tx.source,
      contractAddress,
    });
    contractInstance.setOptions({ backend });
  } catch (e) {
    handleUnknownError(e);
  }
  return Promise.resolve(contractInstance);
};

const getAddress = async (name) => {
  await watchUntilTruthy(() => store.getters['sdkPlugin/sdk']);
  try {
    return getAddressByNameEntry(await store.getters['sdkPlugin/sdk'].api.getNameEntryByName(name));
  } catch (e) {
    return null;
  }
};

export const getAddressFromChainName = async (names) => (Array.isArray(names)
  ? Promise.all(names.map(async (n) => getAddress(n))) : getAddress(names));

export const getTippingContractInstance = async (tx) => {
  if (tippingContract) return tippingContract;
  await watchUntilTruthy(() => store.getters['sdkPlugin/sdk']);
  tippingContract = await setContractInstance(tx, store.getters['sdkPlugin/sdk'], tx.address);
  return tippingContract;
};

export const contractCall = async ({
  instance,
  method,
  params = [],
  decode = false,
  async = true,
}) => {
  let call;
  try {
    call = await instance.methods[method](...params);
  } catch (e) {
    if (e.message.indexOf('wrong_abi_version') > -1) {
      instance.setOptions({ backend: BACKEND_AE_VM });
      return contractCall({
        instance, method, params, decode, async,
      });
    }
    throw e.message;
  }

  if (async) {
    return decode ? call.decodedResult : call;
  }
  return instance.methods[method](...params);
};

export const contractCallStatic = async ({ tx, callType }) => {
  const { isLoggedIn } = useAccounts({ store });
  if (typeof callType !== 'undefined' && callType === 'static') {
    if (isLoggedIn.value) {
      const contractInstance = await getTippingContractInstance(tx);
      const call = await contractCall({
        instance: contractInstance,
        method: tx.method,
        params: [...tx.params, tx.options],
      });
      if (call) {
        return call;
      }
      const error = new Error('Contract call failed');
      error.payload = { tx };
      throw error;
    } else {
      throw new Error('You need to unlock the wallet first');
    }
  }
  throw new Error('No data to return');
};

export const detectConnectionType = (port) => {
  const extensionProtocol = IS_FIREFOX ? 'moz-extension' : 'chrome-extension';
  const [senderUrl] = port.sender.url.split('?');
  const isExtensionSender = senderUrl.startsWith(`${extensionProtocol}://${browser.runtime.id}/index.html`)
    || IS_FIREFOX;
  if (CONNECTION_TYPES.POPUP === port.name && isExtensionSender) {
    return port.name;
  }
  return CONNECTION_TYPES.OTHER;
};
