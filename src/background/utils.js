import { isEqual } from 'lodash-es';
import Universal from '@aeternity/aepp-sdk/es/ae/universal';
import Node from '@aeternity/aepp-sdk/es/node';
import { setContractInstance, contractCall, getAddressByNameEntry } from '../popup/utils/helper';
import Logger from '../lib/logger';
import store from './store';

let sdk;
let tippingContract;

(async () => {
  await store.dispatch('ensureRestored');
  store.watch(
    (state, { activeNetwork }) => activeNetwork,
    async (network, oldNetwork) => {
      if (isEqual(network, oldNetwork)) return;
      if (!sdk) return;
      sdk.pool.delete(network.name);
      sdk.addNode(network.name, await Node({ url: network.url }), true);
    },
  );
})();

export const getSDK = async () => {
  if (!sdk) {
    try {
      await store.dispatch('ensureRestored');
      const network = store.getters.activeNetwork;
      const node = await Node({ url: network.url });
      sdk = await Universal({
        nodes: [{ name: network.name, instance: node }],
        networkId: network.networkId,
        nativeMode: true,
        compilerUrl: network.compilerUrl,
      });
    } catch (e) {
      Logger.write(e);
    }
  }

  return sdk;
};

const getAddress = async (name) => {
  await getSDK();
  try {
    return getAddressByNameEntry(await sdk.api.getNameEntryByName(name));
  } catch (e) {
    return null;
  }
};

export const getAddressFromChainName = async (names) =>
  Array.isArray(names) ? Promise.all(names.map(async (n) => getAddress(n))) : getAddress(names);

export const getTippingContractInstance = async (tx) => {
  if (tippingContract) return tippingContract;
  await getSDK();
  tippingContract = await setContractInstance(tx, sdk, tx.address);
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
