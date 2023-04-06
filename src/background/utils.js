import { useAccounts } from '../composables';
import {
  setContractInstance,
  contractCall,
  getAddressByNameEntry,
  watchUntilTruthy,
} from '../popup/utils';
import store from './store';

let tippingContract;

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
