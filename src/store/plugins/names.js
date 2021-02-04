import Vue from 'vue';
import BigNumber from 'bignumber.js';
import { aettosToAe, fetchJson, postJson } from '../../popup/utils/helper';
import { i18n } from './languages';
import { AUTO_EXTEND_NAME_BLOCKS_INTERVAL } from '../../popup/utils/constants';

export default (store) => {
  store.registerModule('names', {
    namespaced: true,
    state: {
      owned: [],
      defaults: {},
    },
    getters: {
      getDefault: ({ defaults }, getters, { sdk }, { activeNetwork }) => (address) => {
        if (!defaults) return '';
        let { networkId } = activeNetwork;
        if (sdk) networkId = sdk.getNetworkId();
        return defaults[`${address}-${networkId}`];
      },
      getName: ({ owned }) => (name) => owned.find((n) => n.name === name),
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
      setAutoExtend(state, { index, value }) {
        Vue.set(state.owned[index], 'autoExtend', value);
      },
    },
    actions: {
      async fetchOwned({
        state: { owned },
        rootGetters: { activeNetwork },
        rootState: { sdk, middleware, account },
        commit,
        getters: { getDefault },
        dispatch,
      }) {
        if (!middleware) return;
        const getPendingNameClaimTransactions = (address) =>
          sdk.api.getPendingAccountTransactionsByPubkey(address).then(
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

        const defaultName = getDefault(account.publicKey);
        const names = await Promise.all([
          getPendingNameClaimTransactions(account.publicKey),
          middleware.getOwnedBy(account.publicKey).then(({ active }) =>
            owned
              ? active
                  .map(({ info, name }) => ({
                    createdAtHeight: info.activeFrom,
                    expiresAt: info.expireHeight,
                    owner: info.ownership.current,
                    pointers: info.pointers,
                    name,
                  }))
                  .map((name) => {
                    const oldName = owned.find((n) => n.name === name.name);
                    if (!oldName) return name;
                    const revoked = name.expiresAt < oldName.expiresAt;
                    if (revoked)
                      commit(
                        'addNotification',
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
                    return {
                      ...(revoked || oldName.revoked ? { revoked: true } : {}),
                      autoExtend: oldName.autoExtend,
                      ...name,
                    };
                  })
              : active,
          ),
        ]).then((arr) => arr.flat());

        commit('set', names);

        const claimed = names.filter((n) => !n.pending && !n.revoked).map(({ name }) => name);
        if (!claimed.length) {
          if (defaultName) commit('setDefault', { address: account.publicKey });
          return;
        }
        const { preferredChainName: defaultNameBackend } = await fetchJson(
          `${activeNetwork.backendUrl}/profile/${account.publicKey}`,
        ).catch(() => {
          return {};
        });
        if (!claimed.includes(defaultNameBackend)) {
          await dispatch('setDefault', { address: account.publicKey, name: claimed[0] });
          return;
        }
        if (defaultName !== defaultNameBackend) {
          commit('setDefault', { address: account.publicKey, name: defaultNameBackend });
        }
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
      async setDefault(
        { rootState: { sdk }, commit, rootGetters: { activeNetwork } },
        { name, address },
      ) {
        const response = await postJson(`${activeNetwork.backendUrl}/profile`, {
          body: {
            author: address,
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
        await postJson(`${activeNetwork.backendUrl}/profile`, {
          body: respondChallenge,
        });
        commit('setDefault', { name, address });
      },
    },
  });

  store.watch(
    ({ middleware }) => middleware,
    async (middleware) => {
      if (!middleware) return;

      await store.dispatch('names/fetchOwned');

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
};
