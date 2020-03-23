import Universal from '@aeternity/aepp-sdk/es/ae/universal';
import Node from '@aeternity/aepp-sdk/es/node';
import MemoryAccount from '@aeternity/aepp-sdk/es/account/memory';
import store from '../store';
import { postMessage } from '../popup/utils/connection';
import { parseFromStorage, middleware, getAllNetworks } from '../popup/utils/helper';
import { TIPPING_CONTRACT } from '../popup/utils/constants';

export default {
  countError: 0,
  async init() {
    const { userAccount } = await browser.storage.local.get('userAccount');
    if (!userAccount) {
      store.commit('SET_MAIN_LOADING', false);
      return { loggedIn: false };
    }

    const address = await store.dispatch('generateWallet', { seed: userAccount.privateKey });
    store.commit('UPDATE_ACCOUNT', userAccount);
    store.commit('SET_ACTIVE_ACCOUNT', { publicKey: address, index: 0 });
    let sub = [];
    const { subaccounts } = await browser.storage.local.get('subaccounts');
    if (!subaccounts || (subaccounts && !subaccounts.find(f => f.publicKey === userAccount.publicKey))) {
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

    /* Get cached balance */
    const { tokenBal } = await browser.storage.local.get('tokenBal');
    if (tokenBal && tokenBal !== '0.000') store.commit('UPDATE_BALANCE', parseFloat(tokenBal));
    store.commit('SWITCH_LOGGED_IN', true);

    /* Get network */
    const networks = await getAllNetworks();
    store.commit('SET_NETWORKS', networks);
    const { activeNetwork } = await browser.storage.local.get(['activeNetwork']);
    if (activeNetwork) store.commit('SWITCH_NETWORK', activeNetwork);

    store.commit('SET_MAIN_LOADING', false);
    return { loggedIn: true };
  },
  async initMiddleware() {
    const { network, current } = store.getters;
    store.commit('SET_MIDDLEWARE', (await middleware(network, current)).api);
  },
  async initSdk() {
    const keypair = await this.getKeyPair();
    if (keypair.error) {
      await this.logout();
      return;
    }

    const { network, current } = store.getters;
    const node = await Node({ url: network[current.network].internalUrl, internalUrl: network[current.network].internalUrl });
    const account = MemoryAccount({ keypair });
    try {
      const sdk = await Universal({
        nodes: [{ name: current.network, instance: node }],
        accounts: [account],
        networkId: network[current.network].networkId,
        nativeMode: true,
        compilerUrl: network[current.network].compilerUrl,
      });
      await store.dispatch('initSdk', sdk);
      await this.initContractInstances();
      await this.initMiddleware();
      store.commit('SET_NODE_STATUS', 'connected');
      setTimeout(() => store.commit('SET_NODE_STATUS', ''), 2000);
    } catch (error) {
      this.countError += 1;
      if (this.countError < 3) await this.initSdk();
      else store.commit('SET_NODE_STATUS', 'error');
    }
  },
  async logout() {
    await browser.storage.local.remove(['isLogged', 'activeAccount']);
    store.commit('SET_ACTIVE_ACCOUNT', { publicKey: '', index: 0 });
    store.commit('UNSET_SUBACCOUNTS');
    store.commit('UPDATE_ACCOUNT', {});
    store.commit('SWITCH_LOGGED_IN', false);
  },
  async getKeyPair() {
    const { activeAccount } = store.getters;
    const { account } = store.getters;
    const res = await postMessage({ type: 'getKeypair', payload: { activeAccount, account } });
    return res.error ? { error: true } : parseFromStorage(res);
  },
  async initContractInstances() {
    store.commit(
      'SET_TIPPING',
      await store.getters.sdk.getContractInstance(TIPPING_CONTRACT, { contractAddress: store.getters.network[store.getters.current.network].tipContract, forceCodeCheck: true })
    );
  },
};
