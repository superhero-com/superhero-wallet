import Vue from 'vue';
import BigNumber from 'bignumber.js';
import {
  aettosToAe, fetchJson, postJson, checkAddress, checkAensName,
} from '../../popup/utils/helper';
import { i18n } from './languages';
import { AUTO_EXTEND_NAME_BLOCKS_INTERVAL } from '../../popup/utils/constants';

export default (store) => {
  store.registerModule('names', {
    namespaced: true,
    state: {
      owned: [],
      defaults: {},
      preferred: {},
      auctions: {},
    },
    getters: {
      get: ({ owned }) => (name) => owned.find((n) => n.name === name),
      getDefault: ({ defaults }, getters, { sdk }, { activeNetwork }) => (address) => {
        if (!defaults) return '';
        let { networkId } = activeNetwork;
        if (sdk) networkId = sdk.getNetworkId();
        return defaults[`${address}-${networkId}`];
      },
      getPreferred: (
        { preferred }, { getDefault }, _, { account, activeNetwork },
      ) => (address) => {
        if (account.address === address) return getDefault(address);
        store.dispatch('names/setPreferred', address);
        return preferred[`${address}-${activeNetwork.networkId}`] || '';
      },
      getName: ({ owned }) => (name) => owned.find((n) => n.name === name),
      getAuction: ({ auctions }) => (name) => auctions[name] || null,
    },
    mutations: {
      set(state, names) {
        state.owned = names;
      },
      setDefault({ defaults }, { address, name }) {
        const networkId = store.state.sdk.getNetworkId();
        if (name) Vue.set(defaults, `${address}-${networkId}`, name);
        else Vue.delete(defaults, `${address}-${networkId}`);
      },
      setAutoExtend(state, { name, value }) {
        const index = state.owned.findIndex((n) => n.name === name);
        Vue.set(state.owned[index], 'autoExtend', value);
      },
      setPreferred({ preferred }, { address, name }) {
        const networkId = store.state.sdk.getNetworkId();
        if (name) Vue.set(preferred, `${address}-${networkId}`, name);
        else Vue.delete(preferred, `${address}-${networkId}`);
      },
      setAuctionEntry(state, { name, expiration, bids }) {
        state.auctions[name] = { expiration, bids };
      },
    },
    actions: {
      async fetchOwned({
        state: { owned },
        rootGetters: { accounts },
        rootState: { middleware },
        commit,
        dispatch,
      }) {
        if (!middleware) return;
        const getPendingNameClaimTransactions = (address) => dispatch('fetchPendingTransactions', address, { root: true }).then((transactions) => transactions
          .filter(({ tx: { type } }) => type === 'NameClaimTx')
          .map(({ tx, ...otherTx }) => ({
            ...otherTx,
            ...tx,
            owner: tx.accountId,
          })));

        const names = await Promise.all(
          accounts.map(({ address }) => Promise.all([
            getPendingNameClaimTransactions(address),
            middleware.getOwnedBy(address).then(({ active }) => active.map(({ info, name }) => ({
              createdAtHeight: info.activeFrom,
              expiresAt: info.expireHeight,
              owner: info.ownership.current,
              pointers: info.pointers,
              autoExtend: owned.find((n) => n.name === name)?.autoExtend,
              name,
            }))),
          ])),
        ).then((arr) => arr.flat(2));

        commit('set', names);
      },
      async fetchAuctions({ rootState: { middleware } }) {
        if (!middleware) return [];
        return (
          await middleware.getAllAuctions({ by: 'expiration', direction: 'forward' })
        ).data.map(({ name, info }) => ({
          name,
          expiration: info.auctionEnd,
          lastBid: info.lastBid.tx,
        }));
      },
      async fetchAuctionEntry({ rootState: { middleware } }, name) {
        if (!middleware) return {};
        const { info } = await middleware.getAuctionInfoByName(name);
        return {
          expiration: info.auctionEnd,
          bids: await Promise.all(
            info.bids.map(async (index) => {
              const { tx } = await middleware.getTxByIndex(index);
              return {
                accountId: tx.accountId,
                nameFee: BigNumber(aettosToAe(tx.nameFee)),
              };
            }),
          ),
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
      async setDefaults(
        { rootGetters: { activeNetwork, accounts }, commit },
      ) {
        await Promise.all(accounts.map(async ({ address }) => {
          const { preferredChainName: defaultNameBackend } = await fetchJson(
            `${activeNetwork.backendUrl}/profile/${address}`,
          ).catch(() => null);
          commit('setDefault', { address, name: defaultNameBackend });
        }));
      },
      async setDefault(
        { rootState: { sdk }, commit, rootGetters: { activeNetwork } },
        { name, address },
      ) {
        const response = await postJson(`${activeNetwork.backendUrl}/profile/${address}`, {
          body: {
            preferredChainName: name,
          },
        });
        const signedChallenge = Buffer.from(await sdk.signMessage(response.challenge)).toString(
          'hex',
        );
        const respondChallenge = {
          challenge: response.challenge,
          signature: signedChallenge,
        };
        await postJson(`${activeNetwork.backendUrl}/profile/${address}`, {
          body: respondChallenge,
        });
        commit('setDefault', { name, address });
      },
      async getAddress({ rootState: { middleware } }, id) {
        if (checkAddress(id)) return id;
        if (checkAensName(id)) {
          const { info: nameEntry } = await middleware.getNameById(id);
          return nameEntry.pointers?.accountPubkey;
        }
        return '';
      },
      async setPreferred({
        rootState: { middleware },
        rootGetters: { activeNetwork },
        commit,
      }, address) {
        if (!middleware) return;
        const { preferredChainName } = await fetchJson(`${activeNetwork.backendUrl}/profile/${address}`).catch(() => ({}));
        if (preferredChainName) {
          commit('setPreferred', { address, name: preferredChainName });
        } else {
          commit('setPreferred', { address });
        }
      },
    },
  });

  store.watch(
    ({ middleware }) => middleware,
    async (middleware) => {
      if (!middleware) return;

      await store.dispatch('names/fetchOwned');
      await store.dispatch('names/setDefaults');

      const height = await store.state.sdk.height();
      await Promise.all(
        store.state.names.owned
          .filter(({ autoExtend }) => autoExtend)
          .filter(({ expiresAt }) => expiresAt - height < AUTO_EXTEND_NAME_BLOCKS_INTERVAL)
          .map(({ name }) => store.dispatch('names/updatePointer', { name, type: 'extend' })),
      );
    },
    { immediate: true },
  );

  store.watch(
    ({ accountCount }) => accountCount,
    async () => {
      if (!store.state.middleware) return;
      await store.dispatch('names/fetchOwned');
      await store.dispatch('names/setDefaults');
    },
    { immediate: true },
  );
};
