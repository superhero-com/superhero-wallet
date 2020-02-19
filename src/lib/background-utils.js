import Universal from '@aeternity/aepp-sdk/es/ae/universal';
import Node from '@aeternity/aepp-sdk/es/node';
import { networks, DEFAULT_NETWORK } from '../popup/utils/constants';
import { setContractInstance, contractCall } from '../popup/utils/helper';

let sdk;
let controller;
let tippingContract;

export const setController = contr => {
  controller = contr;
};

export const getActiveAccount = () =>
  new Promise((resolve, rejet) => {
    browser.storage.local.get('userAccount').then(data => {
      if (data.userAccount && data.userAccount.hasOwnProperty('publicKey')) {
        browser.storage.local.get('subaccounts').then(subaccounts => {
          browser.storage.local.get('activeAccount').then(active => {
            let activeIdx = 0;
            if (active.hasOwnProperty('activeAccount')) {
              activeIdx = active.activeAccount;
            }
            const address = subaccounts.subaccounts[activeIdx].publicKey;
            resolve({ account: { publicKey: address }, activeAccount: activeIdx });
          });
        });
      } else {
        resolve(false);
      }
    });
  });

export const getActiveNetwork = async () => {
  const { activeNetwork } = await browser.storage.local.get('activeNetwork');
  return networks[activeNetwork || DEFAULT_NETWORK];
};

export const getSDK = async (keypair = {}) => {
  if (!sdk) {
    try {
      const network = await getActiveNetwork();
      const node = await Node({ url: network.internalUrl, internalUrl: network.internalUrl });
      sdk = await Universal({
        nodes: [{ name: DEFAULT_NETWORK, instance: node }],
        networkId: network.networkId,
        nativeMode: true,
        compilerUrl: network.compilerUrl,
      });
    } catch (e) {}
  }

  return sdk;
};

export const getAddressFromChainName = async names => {
  const sdk = await getSDK();
  return Promise.all(
    names.map(async n => {
      try {
        return (await sdk.api.getNameEntryByName(n)).pointers[0].id;
      } catch (e) {
        console.log(e);
        return null;
      }
    })
  );
};

export const getTippingContractInstance = async tx => {
  if (tippingContract) return tippingContract;
  const sdk = await getSDK();
  tippingContract = await setContractInstance(tx, sdk, tx.address);
  return tippingContract;
};

export const contractCallStatic = async ({ tx, callType }) =>
  new Promise(async (resolve, reject) => {
    try {
      const { activeAccount, account } = await getActiveAccount();
      // controller.isLoggedIn() &&
      if (typeof callType !== 'undefined' && callType == 'static' && account) {
        // let keypair = parseFromStorage(await controller.getKeypair({ activeAccount, account }));
        // const sdk = await getSDK();
        // const contractInstance = await setContractInstance(tx, sdk, tx.address);
        const contractInstance = await getTippingContractInstance(tx);
        const call = await contractCall({ instance: contractInstance, method: tx.method, params: [...tx.params, tx.options] });
        if (call) {
          resolve(call);
        } else {
          reject('Contract call failed');
        }
      } else if (!controller.isLoggedIn() && typeof callType !== 'undefined' && callType == 'static') {
        reject('You need to unlock the wallet first');
      }
    } catch (e) {
      reject(e);
    }
  });
