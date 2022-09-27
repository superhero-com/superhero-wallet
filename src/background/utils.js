import {
  setContractInstance,
  contractCall,
  getAddressByNameEntry,
  watchUntilTruthy,
} from '../popup/utils/helper';
import store from './store';
import { SIMPLEX_URL } from '../popup/utils/constants';

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
  const { account } = store.getters;
  if (typeof callType !== 'undefined' && callType === 'static' && account) {
    const contractInstance = await getTippingContractInstance(tx);
    const call = await contractCall({
      instance: contractInstance,
      method: tx.method,
      params: [...tx.params, tx.options],
    });
    if (call) return call;
    const error = new Error('Contract call failed');
    error.payload = { tx };
    throw error;
  }
  if (!store.getters.isLoggedIn && typeof callType !== 'undefined' && callType === 'static') {
    throw new Error('You need to unlock the wallet first');
  }
  throw new Error('No data to return');
};

export const buildSimplexLink = (address) => {
  const link = new URL(SIMPLEX_URL);
  link.searchParams.set('wallet_address', address);
  return link.toString();
};
