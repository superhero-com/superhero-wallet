import Universal from '@aeternity/aepp-sdk/es/ae/universal';
import Node from '@aeternity/aepp-sdk/es/node';
import { isEmpty } from 'lodash-es';
import {
  setContractInstance,
  contractCall,
  getAddressByNameEntry,
  getActiveNetwork,
} from '../popup/utils/helper';
import { getState } from '../store/plugins/persistState';
import Logger from '../lib/logger';
import walletController from './wallet-controller';

let sdk;
let tippingContract;

export const getActiveAccount = async () => {
  const { account } = await getState();
  if (!isEmpty(account)) {
    return { account: { publicKey: account.publicKey }, activeAccount: 0 };
  }
  return false;
};

export const switchNode = async () => {
  if (sdk) {
    const network = await getActiveNetwork();
    const node = await Node({ url: network.url });
    try {
      await sdk.addNode(network.name, node, true);
    } catch (e) {
      console.warn(`switchNode: ${e}`);
    }
    sdk.selectNode(network.name);
  }
};

export const getSDK = async () => {
  if (!sdk) {
    try {
      const network = await getActiveNetwork();
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
  const { account } = await getActiveAccount();
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
  if (!walletController.isLoggedIn() && typeof callType !== 'undefined' && callType === 'static') {
    throw new Error('You need to unlock the wallet first');
  }
  throw new Error('No data to return');
};
