import { uniqBy, flatten, uniq } from 'lodash-es';
import BigNumber from 'bignumber.js';
import axios from 'axios';
import * as types from './mutation-types';
import {
  convertToAE,
  stringifyForStorage,
  parseFromStorage,
  aettosToAe,
  getAddressByNameEntry,
} from '../popup/utils/helper';
import { postMessage, postMessageToContent } from '../popup/utils/connection';

export default {
  setAccount({ commit }, payload) {
    commit(types.UPDATE_ACCOUNT, payload);
    commit(types.UPDATE_BALANCE);
  },
  setSubAccount({ commit }, payload) {
    commit(types.SET_SUBACCOUNT, payload);
  },
  setSubAccounts({ commit }, payload) {
    commit(types.SET_SUBACCOUNTS, payload);
  },
  async switchNetwork({ commit }, payload) {
    return commit(types.SWITCH_NETWORK, payload);
  },
  async updateBalance({ commit, state }) {
    const balance = await state.sdk.balance(state.account.publicKey).catch(() => 0);
    commit(types.UPDATE_BALANCE, convertToAE(balance));
  },
  async fetchTransactions({ state }, { limit, page }) {
    if (!state.middleware) return [];
    const { middlewareUrl } = state.network[state.current.network];
    const { publicKey } = state.account;
    try {
      return (
        await axios.get(
          `${middlewareUrl}/middleware/transactions/account/${publicKey}?page=${page}&limit=${limit}`,
        )
      ).data;
    } catch (e) {
      return [];
    }
  },
  updateLatestTransactions({ commit }, payload) {
    commit(types.UPDATE_LATEST_TRANSACTIONS, payload);
  },
  setAccountName({ commit }, payload) {
    commit(types.SET_ACCOUNT_NAME, payload);
  },
  initSdk({ commit }, payload) {
    commit(types.INIT_SDK, payload);
  },
  async getRegisteredNames({ commit, state, dispatch }) {
    if (!state.middleware) return;
    const { middlewareUrl } = state.network[state.current.network];
    const res = await Promise.all(
      state.subaccounts.map(async ({ publicKey }, index) => {
        if (publicKey) {
          let names = await Promise.all([
            (async () =>
              (
                await state.sdk.api
                  .getPendingAccountTransactionsByPubkey(publicKey)
                  .catch(() => ({ transactions: [] }))
              ).transactions
                .filter(({ tx: { type } }) => type === 'NameClaimTx')
                .map(({ tx, ...otherTx }) => ({
                  ...otherTx,
                  ...tx,
                  pending: true,
                  owner: tx.accountId,
                })))(),
            (async () => {
              try {
                return uniqBy(
                  (await axios.get(`${middlewareUrl}/middleware/names/reverse/${publicKey}`)).data,
                  'name',
                );
              } catch (e) {
                console.error(`middleware.getNames: ${e}`);
              }
              return [];
            })(),
            (async () => {
              try {
                return await state.middleware.getActiveNames({ owner: publicKey });
              } catch (e) {
                console.error(`middleware.getActiveNames: ${e}`);
              }
              return [];
            })(),
          ]);
          names = flatten(names);
          names = uniqBy(names, 'name');
          if (!process.env.RUNNING_IN_TESTS) {
            if (names.length) {
              commit(types.SET_ACCOUNT_AENS, {
                account: index,
                aename: names[0].name,
                pending: !!names[0].pending,
              });
            } else {
              commit(types.SET_ACCOUNT_AENS, { account: index, aename: null, pending: false });
            }
          }
          return names;
        }
        return [];
      }),
    );
    await dispatch(
      'setSubAccounts',
      state.subaccounts.filter(s => s.publicKey),
    );
    commit(types.SET_NAMES, { names: Array.prototype.concat.apply([], res) });
  },
  async fetchAuctionEntry({ state: { sdk } }, name) {
    const { info, bids } = await sdk.middleware.getAuctionInfoByName(name);
    return {
      ...info,
      bids: bids.map(({ tx }) => ({
        ...tx,
        nameFee: BigNumber(aettosToAe(tx.nameFee)),
      })),
    };
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

  async setLogin({ commit, dispatch }, { keypair }) {
    commit('UPDATE_ACCOUNT', keypair);

    const sub = [
      {
        name: 'Main Account',
        publicKey: keypair.publicKey,
        balance: 0,
        root: true,
        aename: null,
      },
    ];
    commit('SET_ACTIVE_ACCOUNT', { publicKey: keypair.publicKey, index: 0 });
    await dispatch('setSubAccounts', sub);
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
  async checkBackupSeed() {
    return (await browser.storage.local.get('backed_up_Seed')).backed_up_Seed;
  },
  async getWebPageAddresses({ state: { sdk } }) {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    const { address, chainName } = await postMessageToContent({ method: 'getAddresses' }, tab.id);
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
};
