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
import Logger from './logger';

let sdk;
let controller;
let tippingContract;
let tippingContractAddress;

export const setController = contr => {
  controller = contr;
};

export const getActiveAccount = async () => {
  const { account } = await getState();
  if (!isEmpty(account)) {
    return { account: { publicKey: account.publicKey }, activeAccount: 0 };
  }
  return false;
};

export const getNodes = async () => {
  const { network, all } = await getActiveNetwork();
  return {
    network,
    nodes: all,
    activeNetwork: network.name,
  };
};

export const switchNode = async () => {
  if (sdk) {
    const { network } = await getNodes();
    const node = await Node({ url: network.internalUrl, internalUrl: network.internalUrl });
    try {
      await sdk.addNode(network.name, node, true);
    } catch (e) {
      console.error(`switchNode: ${e}`);
    }
    sdk.selectNode(network.name);
  }
};

export const getSDK = async () => {
  if (!sdk) {
    try {
      const { network } = await getNodes();
      const node = await Node({ url: network.internalUrl, internalUrl: network.internalUrl });
      sdk = await Universal({
        nodes: [{ name: network.name, instance: node }],
        networkId: network.networkId,
        nativeMode: true,
        compilerUrl: network.compilerUrl,
      });
    } catch (e) {
      Logger.write({ e, action: 'init-sdk-background' });
    }
  }

  return sdk;
};

const getAddress = async name => {
  await getSDK();
  try {
    return getAddressByNameEntry(await sdk.api.getNameEntryByName(name));
  } catch (e) {
    return null;
  }
};

export const getAddressFromChainName = async names =>
  Array.isArray(names) ? Promise.all(names.map(async n => getAddress(n))) : getAddress(names);

export const getTippingContractInstance = async tx => {
  if (tippingContract) return tippingContract;
  await getSDK();
  tippingContract = await setContractInstance(tx, sdk, tx.address);
  return tippingContract;
};

export const getTippingContractAddress = async address => {
  if (tippingContractAddress) return tippingContractAddress;
  await getSDK();
  tippingContractAddress = address.includes('.chain')
    ? getAddressByNameEntry(await sdk.api.getNameEntryByName(address), 'contract_pubkey')
    : address;
  return tippingContractAddress;
};

export const contractCallStatic = async ({ tx, callType }) =>
  new Promise(async (resolve, reject) => {
    try {
      const { account } = await getActiveAccount();
      if (typeof callType !== 'undefined' && callType === 'static' && account) {
        const contractInstance = await getTippingContractInstance(tx);
        const call = await contractCall({
          instance: contractInstance,
          method: tx.method,
          params: [...tx.params, tx.options],
        });
        if (call) {
          resolve(call);
        } else {
          reject(new Error('Contract call failed'));
          Logger.write({
            msg: 'Contract call failed',
            tx,
            action: 'contract-call-background',
          });
        }
      } else if (
        !controller.isLoggedIn() &&
        typeof callType !== 'undefined' &&
        callType === 'static'
      ) {
        reject(new Error('You need to unlock the wallet first'));
        Logger.write({
          msg: 'You need to unlock the wallet first',
          action: 'contract-call-background',
        });
      }
    } catch (e) {
      reject(e);
      Logger.write({ e, action: 'contract-call-background' });
    }
  });
