/* eslint no-param-reassign: ["error", { "ignorePropertyModificationsFor": ["state"] }] */
import { update } from 'lodash-es';
import BigNumber from 'bignumber.js';
import Vue from 'vue';
import { MAGNITUDE } from './constants';
import {
  handleUnknownError, isAccountNotFoundError, getAddressByNameEntry,
} from './helper';

export default (store) => {
  store.registerModule('names', {
    namespaced: true,
    state: {
      names: {},
      owned: null,
    },
    getters: {
      get: ({ names }, getters, { accounts: { list } }, rootGetters) => (address, local = true) => {
        store.dispatch('names/fetch', address);
        if (names[address].name) return names[address].name;
        if (local) {
          const account = list.find(a => a.address === address);
          if (account) return rootGetters['accounts/getName'](account);
        }
        return '';
      },
      isPending: ({ owned }) => name => (
        !!((owned && owned.names.find(t => t.name === name)) || {}).pending
      ),
    },
    mutations: {
      set({ names }, { address, name }) {
        Vue.set(names, address, { name });
      },
      setOwned(state, owned) {
        state.owned = owned;
      },
      reset(state) {
        state.names = {};
        state.owned = null;
      },
    },
    actions: {
      async getHeight({ rootState }) {
        let subscription;
        const height = await new Promise((resolve) => {
          subscription = rootState.observables.topBlockHeight.subscribe(h => h !== 0 && resolve(h));
        });
        subscription.unsubscribe();
        return height;
      },
      async fetch({
        rootState, state, commit, dispatch,
      }, address) {
        if (state.names[address]) return;
        commit('set', { address });
        const sdk = rootState.sdk.then ? await rootState.sdk : rootState.sdk;
        const height = await dispatch('getHeight');
        const names = (await sdk.middleware.getNameByAddress(address))
          .filter(({ expiresAt }) => expiresAt > height);
        if (names.length) commit('set', { address, name: names[0].name });
      },
      async fetchOwned({ rootState, commit }) {
        const sdk = rootState.sdk.then ? await rootState.sdk : rootState.sdk;
        const [names, bids] = await Promise.all([
          (await Promise.all(rootState.accounts.list.map(({ address }) => Promise.all([
            sdk.api.getPendingAccountTransactionsByPubkey(address)
              .then(({ transactions }) => transactions
                .filter(({ tx: { type } }) => type === 'NameClaimTx')
                .map(({ tx, ...otherTx }) => ({
                  ...otherTx,
                  ...tx,
                  pending: true,
                  owner: tx.accountId,
                })))
              .catch((error) => {
                if (!isAccountNotFoundError(error)) {
                  handleUnknownError(error);
                }
                return [];
              }),
            sdk.middleware.getActiveNames({ owner: address }),
          ])))).flat(2),
          (await Promise.all(rootState.accounts.list
            .map(({ address }) => sdk.middleware.getNameAuctionsBidsbyAddress(address))))
            .flat()
            .filter(({ nameAuctionEntry, transaction }) => nameAuctionEntry
              .winningBid === transaction.tx.nameFee)
            .map(bid => update(
              bid,
              'transaction.tx.nameFee',
              v => BigNumber(v).shiftedBy(-MAGNITUDE),
            )),
        ]);
        commit('setOwned', { names, bids });
      },
      async fetchName({ rootState, commit }, name) {
        const address = getAddressByNameEntry(
          await rootState.sdk.api.getNameEntryByName(name),
        );
        commit('set', { address, name });
        return address;
      },
      async fetchAuctionEntry({ rootState }, name) {
        const sdk = rootState.sdk.then ? await rootState.sdk : rootState.sdk;
        const { info, bids } = await sdk.middleware.getAuctionInfoByName(name);
        return {
          ...info,
          bids: bids.map(({ tx }) => ({
            ...tx,
            nameFee: BigNumber(tx.nameFee).shiftedBy(-MAGNITUDE),
          })),
        };
      },
      async getAddressByName({ state, dispatch }, name) {
        return (
          Object.entries(state.names).find(([, value]) => value.name === name) || {}
        ).key || dispatch('fetchName', name);
      },
    },
  });

  store.watch((state, { currentNetwork }) => currentNetwork, () => store.commit('names/reset'));
};
