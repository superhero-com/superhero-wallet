import Vue from 'vue';
import axios from 'axios';
import BigNumber from 'bignumber.js';
import { aettosToAe } from '../../popup/utils/helper';
import Backend from '../../lib/backend';
import { i18n } from '../../popup/utils/i18nHelper';

export default store =>
  store.registerModule('names', {
    namespaced: true,
    state: {
      all: [],
      defaults: {},
    },
    getters: {
      getDefault: ({ defaults }, getters, { sdk }, { activeNetwork }) => address => {
        let { networkId } = activeNetwork;
        if (sdk) networkId = sdk.getNetworkId();
        return defaults[`${address}-${networkId}`];
      },
      getName: ({ all }) => name => all.find(n => n.name === name),
    },
    mutations: {
      set(state, names) {
        state.all = names;
      },
      setDefault({ defaults }, { address, networkId, name }) {
        Vue.set(defaults, `${address}-${networkId}`, name);
      },
    },
    actions: {
      async fetchOwned({ rootState, commit, getters: { getDefault }, dispatch }) {
        if (!rootState.middleware) return;
        const getPendingNameClaimTransactions = address =>
          rootState.sdk.api.getPendingAccountTransactionsByPubkey(address).then(
            ({ transactions }) =>
              transactions
                .filter(({ tx: { type } }) => type === 'NameClaimTx')
                .map(({ tx, ...otherTx }) => ({
                  ...otherTx,
                  ...tx,
                  pending: true,
                  owner: tx.accountId,
                })),
            () => [],
          );
        const namesPromise = Promise.all(
          rootState.subaccounts.map(({ publicKey }) =>
            Promise.all([
              getPendingNameClaimTransactions(publicKey),
              rootState.middleware.getActiveNames({ owner: publicKey }),
            ]),
          ),
        ).then(names => names.flat(2));

        const [names] = await Promise.all([namesPromise]);
        commit('set', names);
        const defaultName = getDefault(rootState.account.publicKey);
        if (names.length && !defaultName) {
          const claimed = names.filter(n => !n.pending);
          if (claimed.length)
            dispatch('setDefault', {
              name: claimed[0].name,
              address: rootState.account.publicKey,
              modal: false,
            });
        }
      },
      async fetchAuctions({ rootGetters: { network, current } }) {
        const middleware = network[current.network].middlewareUrl;
        return (
          await axios(`${middleware}/middleware/names/auctions/active`).catch(() => ({ data: [] }))
        ).data;
      },
      async fetchAuctionEntry({ rootState: { middleware } }, name) {
        const { info, bids } = await middleware.getAuctionInfoByName(name);
        return {
          ...info,
          bids: bids.map(({ tx }) => ({
            ...tx,
            nameFee: BigNumber(aettosToAe(tx.nameFee)),
          })),
        };
      },
      async updatePointer({ rootState: { sdk }, dispatch }, { name, address, type = 'update' }) {
        const nameEntry = await sdk.aensQuery(name);
        if (type === 'extend') {
          nameEntry.extendTtl();
        } else if (type === 'update') {
          nameEntry.update([address], { extendPointers: true });
        }
        dispatch(
          'modals/open',
          { name: 'default', msg: i18n.t('pages.names.pointer-added', { type }) },
          { root: true },
        );
      },
      async setDefault({ rootState: { sdk }, commit, dispatch }, { name, address, modal = true }) {
        commit('setDefault', { name, address, networkId: sdk.getNetworkId() });
        try {
          const response = await Backend.sendProfileData({
            author: address,
            preferredChainName: name,
          });
          const signedChallenge = Buffer.from(await sdk.signMessage(response.challenge)).toString(
            'hex',
          );
          const respondChallenge = {
            challenge: response.challenge,
            signature: signedChallenge,
          };
          await Backend.sendProfileData(respondChallenge);
        } catch (e) {
          if (modal) {
            if (e.type === 'backend')
              dispatch(
                'modals/open',
                { name: 'default', title: 'Backend error', msg: e.message },
                { root: true },
              );
            else throw e;
          }
        }
      },
      async getHeight({ rootState: { sdk } }) {
        return (await sdk.topBlock()).height;
      },
    },
  });
