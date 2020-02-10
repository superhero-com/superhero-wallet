import Universal from '@aeternity/aepp-sdk/es/ae/universal';
import Node from '@aeternity/aepp-sdk/es/node';
import MemoryAccount from '@aeternity/aepp-sdk/es/account/memory';
import store from '../store';
import { postMessage } from '../popup/utils/connection';
import { parseFromStorage, swag } from '../popup/utils/helper';
import { TIPPING_CONTRACT, DEFAULT_NETWORK } from '../popup/utils/constants';

export default {
  store: null,
  countError: 0,
  init(cb) {
    browser.storage.local.get('isLogged').then(data => {
      browser.storage.local.get('userAccount').then(async user => {
        if (user.userAccount && user.hasOwnProperty('userAccount')) {
          try {
            user.userAccount.encryptedPrivateKey = JSON.parse(user.userAccount.encryptedPrivateKey);
          } catch (e) {
            user.userAccount.encryptedPrivateKey = JSON.stringify(user.userAccount.encryptedPrivateKey);
          }
          store.commit('UPDATE_ACCOUNT', user.userAccount);
          const address = await store.dispatch('generateWallet', { seed: user.userAccount.privateKey });
          if (address) {
            browser.storage.local.get('subaccounts').then(subaccounts => {
              const sub = [];
              if (
                !subaccounts.hasOwnProperty('subaccounts') ||
                subaccounts.subaccounts == '' ||
                (typeof subaccounts.subaccounts === 'object' && !subaccounts.subaccounts.find(f => f.publicKey == user.userAccount.publicKey))
              ) {
                sub.push({
                  name: typeof subaccounts.subaccounts !== 'undefined' ? subaccounts.subaccounts.name : 'Main Account',
                  publicKey: user.userAccount.publicKey,
                  root: true,
                  balance: 0,
                });
              }
              if (subaccounts.hasOwnProperty('subaccounts') && subaccounts.subaccounts.length > 0 && subaccounts.subaccounts != '') {
                subaccounts.subaccounts.forEach(su => {
                  sub.push({ ...su });
                });
              }
              store.dispatch('setSubAccounts', sub);
              store.commit('SET_ACTIVE_ACCOUNT', { publicKey: address, index: 0 });
            });

            store.commit('SWITCH_LOGGED_IN', true);
            this.redirectAfterLogin(cb);

            store.commit('SET_MAIN_LOADING', false);
          } else {
            store.commit('SET_MAIN_LOADING', false);
            cb();
          }
        } else {
          browser.storage.local.get('confirmSeed').then(seed => {
            store.commit('SET_MAIN_LOADING', false);
            if (seed.hasOwnProperty('confirmSeed') && seed.confirmSeed == false) {
              cb('/seed');
            } else {
              cb();
            }
          });
        }
      });
    });
  },
  async initSdk(cb) {
    const keypair = await this.getKeyPair();
    if (typeof keypair.error === 'undefined') {
      const { network } = store.getters;
      const { current } = store.getters;
      const node = await Node({ url: network[current.network].internalUrl, internalUrl: network[current.network].internalUrl });
      const account = MemoryAccount({ keypair });
      Universal({
        nodes: [{ name: DEFAULT_NETWORK, instance: node }],
        accounts: [account],
        networkId: network[current.network].networkId,
        nativeMode: true,
        compilerUrl: network[current.network].compilerUrl,
      })
        .then(async sdk => {
          sdk.middleware = (await swag(network, current)).api;
          await store.dispatch('initSdk', sdk);
          store.commit('SET_NODE_STATUS', 'connected');
          this.initContractInstances();
        })
        .catch(err => {
          console.log(err);
          if (this.countError < 2) {
            this.initSdk(cb);
          } else {
            store.commit('SET_NODE_STATUS', 'error');
          }
          this.countError++;
        });
    } else {
      this.logout(() => cb());
    }
  },
  async logout(cb) {
    await browser.storage.local.remove('isLogged');
    await browser.storage.local.remove('activeAccount');
    store.commit('SET_ACTIVE_ACCOUNT', { publicKey: '', index: 0 });
    store.commit('UNSET_SUBACCOUNTS');
    store.commit('UPDATE_ACCOUNT', {});
    store.commit('SWITCH_LOGGED_IN', false);
    cb();
  },
  async getKeyPair() {
    const { activeAccount } = store.getters;
    const { account } = store.getters;
    const { res } = await postMessage({ type: 'getKeypair', payload: { activeAccount, account } });
    return res.error ? { error: true } : parseFromStorage(res);
  },
  async initContractInstances() {
    store.commit('SET_NODE_STATUS', 'connected');
    setTimeout(() => store.commit('SET_NODE_STATUS', ''), 2000);
    // init tipping
    try {
      await store.commit(
        'SET_TIPPING',
        await store.getters.sdk.getContractInstance(TIPPING_CONTRACT, { contractAddress: store.getters.network[store.getters.current.network].tipContract, forceCodeCheck: true })
      );
    } catch (e) {
      console.log(e);
    }
  },
  redirectAfterLogin(cb) {
    if (window.RUNNING_IN_POPUP) {
      store.commit('SET_AEPP_POPUP', true);
      if (window.hasOwnProperty('name') && window.name.includes('popup')) {
        if (window.props.type == 'connectConfirm') {
          cb('/connect');
        } else if (window.props.type == 'sign') {
          cb('/popup-sign-tx');
        } else if (window.props.type == 'askAccounts') {
          cb('/ask-accounts');
        }
      }
    } else {
      cb('/account');
    }
  },
};
