import Universal from '@aeternity/aepp-sdk/es/ae/universal';
import Node from '@aeternity/aepp-sdk/es/node';
import MemoryAccount from '@aeternity/aepp-sdk/es/account/memory';
import store from '../store';
import { postMessage } from '../popup/utils/connection';
import { parseFromStorage, swag } from '../popup/utils/helper';
import { TIPPING_CONTRACT, DEFAULT_NETWORK } from '../popup/utils/constants';

export default {
  countError: 0,
  async init(cb) {
    const { userAccount } = await browser.storage.local.get('userAccount');
    if (userAccount) {
      const address = await store.dispatch('generateWallet', { seed: userAccount.privateKey });
      if (address) {
        store.commit('UPDATE_ACCOUNT', userAccount);
        store.commit('SET_ACTIVE_ACCOUNT', { publicKey: address, index: 0 });
        let sub = [];
        const { subaccounts } = await browser.storage.local.get('subaccounts');
        if (!subaccounts || (subaccounts && !subaccounts.find(f => f.publicKey == userAccount.publicKey))) {
          sub.push({
            name: 'Main Account',
            publicKey: userAccount.publicKey,
            root: true,
            balance: 0,
            aename: null,
          });
        }
        if (subaccounts) sub = [...sub, ...subaccounts.filter(s => s.publicKey)];
        store.dispatch('setSubAccounts', sub);
        const { tokenBal } = await browser.storage.local.get('tokenBal');
        if (tokenBal && tokenBal != '0.000') store.commit('UPDATE_BALANCE', parseFloat(tokenBal));
        store.commit('SWITCH_LOGGED_IN', true);
        this.redirectAfterLogin(cb);
        store.commit('SET_MAIN_LOADING', false);
      } else {
        store.commit('SET_MAIN_LOADING', false);
        cb();
      }
    } else {
      const { confirmSeed } = await browser.storage.local.get('confirmSeed');
      store.commit('SET_MAIN_LOADING', false);
      if (confirmSeed) cb('/seed');
      else cb();
    }
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
    const res = await postMessage({ type: 'getKeypair', payload: { activeAccount, account } });
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
      const url = new URL(window.location.href);
      const type = url.searchParams.get('type');
      if (type) {
        if (type == 'connectConfirm') {
          cb('/connect');
        } else if (type == 'sign') {
          cb('/popup-sign-tx');
        } else if (type == 'askAccounts') {
          cb('/ask-accounts');
        }
      }
    } else {
      cb('/account');
    }
  },
};
