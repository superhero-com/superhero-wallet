import { flatten, uniq, orderBy } from 'lodash-es';
import axios from 'axios';
import * as types from './mutation-types';
import {
  convertToAE,
  stringifyForStorage,
  parseFromStorage,
  getAddressByNameEntry,
} from '../popup/utils/helper';
import { postMessage, postMessageToContent } from '../popup/utils/connection';
import { BACKEND_URL } from '../popup/utils/constants';

export default {
  setAccount({ commit }, payload) {
    commit(types.UPDATE_ACCOUNT, payload);
    commit(types.UPDATE_BALANCE);
  },
  switchNetwork({ commit }, payload) {
    commit(types.SWITCH_NETWORK, payload);
    commit(types.UPDATE_LATEST_TRANSACTIONS, []);
  },
  async updateBalance({ commit, state }) {
    const balance = await state.sdk.balance(state.account.publicKey).catch(() => 0);
    commit(types.UPDATE_BALANCE, convertToAE(balance));
  },
  async fetchTransactions({ state }, { limit, page, recent }) {
    if (!state.middleware) return [];
    const { middlewareUrl } = state.network[state.current.network];
    const { publicKey } = state.account;
    let txs = await Promise.all([
      (async () =>
        (
          await axios
            .get(
              `${middlewareUrl}/middleware/transactions/account/${publicKey}?page=${page}&limit=${limit}`,
            )
            .catch(() => ({ data: [] }))
        ).data)(),
      (async () =>
        (
          await axios
            .get(
              `${BACKEND_URL}/cache/events/?address=${publicKey}&event=TipWithdrawn${
                recent ? `&limit=${limit}` : ''
              }`,
            )
            .catch(() => ({ data: [] }))
        ).data.map(({ address, amount, ...t }) => ({
          tx: { address, amount },
          ...t,
          claim: true,
        })))(),
    ]);
    txs = orderBy(flatten(txs), ['time'], ['desc']);
    return recent ? txs.slice(0, limit) : txs;
  },
  initSdk({ commit, state: { userNetworks, network, current } }, sdk) {
    commit(types.INIT_SDK, sdk);
    const networkId = sdk.getNetworkId();
    const name = current.network;
    const net = { ...network };
    net[name].networkId = networkId;
    commit(
      'SET_USERNETWORKS',
      userNetworks.map(n => (n.name === name ? { ...n, networkId } : { ...n })),
    );
    commit('SET_NETWORKS', net);
  },

  unlockWallet(context, payload) {
    return postMessage({ type: 'unlockWallet', payload });
  },

  async getAccount(context, { idx }) {
    return (await postMessage({ type: 'getAccount', payload: { idx } })).address;
  },

  async getKeyPair({ state: { account } }, { idx }) {
    const { publicKey, secretKey } = parseFromStorage(
      await postMessage({
        type: 'getKeypair',
        payload: { activeAccount: idx, account: { publicKey: account.publicKey } },
      }),
    );
    return { publicKey, secretKey };
  },

  async generateWallet(context, { seed }) {
    return (
      await postMessage({ type: 'generateWallet', payload: { seed: stringifyForStorage(seed) } })
    ).address;
  },

  async setLogin({ commit }, { keypair }) {
    commit('UPDATE_ACCOUNT', keypair);
    commit('SET_ACTIVE_ACCOUNT', { publicKey: keypair.publicKey, index: 0 });
    commit('UPDATE_ACCOUNT', keypair);
    commit('SWITCH_LOGGED_IN', true);
  },
  async setPendingTx({ commit, state: { transactions } }, tx) {
    commit('SET_PENDING_TXS', [...transactions.pending, tx]);
  },
  async setCurrency({
    commit,
    state: {
      currencies,
      current: { currency },
    },
  }) {
    commit('SET_CURRENCY', {
      currency,
      currencyRate: currencies[currency],
    });
    if (!process.env.RUNNING_IN_TESTS)
      commit('setMinTipAmount', +(0.01 * (1 / currencies.usd)).toFixed(2));
  },
  async getCurrencies({ state: { nextCurrenciesFetch }, commit, dispatch }) {
    if (!nextCurrenciesFetch || nextCurrenciesFetch <= new Date().getTime()) {
      try {
        const { aeternity } = (
          await axios.get(
            'https://api.coingecko.com/api/v3/simple/price?ids=aeternity&vs_currencies=usd,eur,aud,ron,brl,cad,chf,cny,czk,dkk,gbp,hkd,hrk,huf,idr,ils,inr,isk,jpy,krw,mxn,myr,nok,nzd,php,pln,ron,rub,sek,sgd,thb,try,zar,xau',
          )
        ).data;
        commit('SET_CURRENCIES', aeternity);
        commit('SET_NEXT_CURRENCY_FETCH', new Date().getTime() + 3600000);
      } catch (e) {
        console.error(`Cannot fetch currencies: ${e}`);
      }
    }
    dispatch('setCurrency');
  },
  async setPermissionForAccount({ commit, state: { connectedAepps } }, { host, account }) {
    if (connectedAepps[host]) {
      if (connectedAepps[host].includes(account)) return;
      commit('UPDATE_CONNECTED_AEPP', { host, account });
    } else {
      commit('ADD_CONNECTED_AEPP', { host, account });
    }
  },
  async getWebPageAddresses({ state: { sdk } }) {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    const { address, chainName } = await postMessageToContent(
      { method: 'getAddresses' },
      tab.id,
    ).catch(() => ({ address: [], chainName: [] }));
    let addresses = Array.isArray(address) ? address : [address];
    const chainNames = Array.isArray(chainName) ? chainName : [chainName];
    const chainNamesAddresses = await Promise.all(
      chainNames.map(async n => {
        try {
          return getAddressByNameEntry(await sdk.api.getNameEntryByName(n));
        } catch (e) {
          return null;
        }
      }),
    );
    addresses = [...addresses, ...chainNamesAddresses];

    return { addresses: uniq(addresses).filter(a => a), tab };
  },

  async getTipContractAddress({ state: { network, current, sdk }, commit }) {
    const { tipContract } = network[current.network];
    const contractAddress = tipContract.includes('.chain')
      ? getAddressByNameEntry(await sdk.api.getNameEntryByName(tipContract), 'contract_pubkey')
      : tipContract;
    commit('SET_TIPPING_ADDRESS', contractAddress);
    return contractAddress;
  },
  async getHeight({ state: { sdk } }) {
    return (await sdk.topBlock()).height;
  },
};
