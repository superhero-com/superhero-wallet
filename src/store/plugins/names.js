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
      owned: [],
      defaults: {},
    },
    getters: {
      getDefault: ({ defaults }, getters, { sdk }, { activeNetwork }) => address => {
        if (!defaults) return '';
        let { networkId } = activeNetwork;
        if (sdk) networkId = sdk.getNetworkId();
        return defaults[`${address}-${networkId}`];
      },
      getName: ({ owned }) => name => owned.find(n => n.name === name),
    },
    mutations: {
      set(state, names) {
        state.owned = names;
      },
      setDefault({ defaults }, { address, networkId, name: { name, revoked } }) {
        if (revoked) Vue.delete(defaults, `${address}-${networkId}`, name);
        else Vue.set(defaults, `${address}-${networkId}`, name);
      },
    },
    actions: {
      async fetchOwned({ state: { owned }, rootState, commit, getters: { getDefault }, dispatch }) {
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
        let names = await Promise.all([
          getPendingNameClaimTransactions(rootState.account.publicKey),
          rootState.middleware.getActiveNames({ owner: rootState.account.publicKey }),
        ]).then(arr => arr.flat());

        const defaultName = getDefault(rootState.account.publicKey);
        let defaultNameRevoked = false;
        if (owned) {
          names = names.map(name => {
            const oldName = owned.find(n => n.name === name.name);
            if (!oldName) return name;
            const revoked = name.expiresAt < oldName.expiresAt;
            if (revoked) {
              if (name.name === defaultName) defaultNameRevoked = true;
              commit(
                'ADD_NOTIFICATION',
                {
                  title: '',
                  content: i18n.t('pages.names.revoked-notification', {
                    name: name.name,
                    block: name.expiresAt,
                  }),
                  route: '',
                },
                { root: true },
              );
            }
            return {
              ...(revoked || oldName.revoked ? { revoked: true } : {}),
              ...name,
            };
          });
        }
        commit('set', names);
        if ((names.length && !defaultName) || defaultNameRevoked) {
          const claimed = names.filter(n => !n.pending);
          if (claimed.length)
            dispatch('setDefault', {
              name: claimed[0],
              address: rootState.account.publicKey,
              modal: false,
            });
        }
      },
      async fetchAuctions({ rootState: { network, current } }) {
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
        try {
          if (type === 'extend') {
            await nameEntry.extendTtl();
          } else if (type === 'update') {
            await nameEntry.update([address], { extendPointers: true });
          }
          dispatch(
            'modals/open',
            { name: 'default', msg: i18n.t('pages.names.pointer-added', { type }) },
            { root: true },
          );
        } catch (e) {
          dispatch('modals/open', { name: 'default', msg: e.message }, { root: true });
        }
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
    },
  });
