import Vue from 'vue';
import BigNumber from 'bignumber.js';
import { aettosToAe, postJson } from '../../popup/utils/helper';
import { i18n } from '../../popup/utils/i18nHelper';
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
      setDefault({ defaults }, { address, networkId, name: { name, revoked } }) {
        if (revoked) Vue.delete(defaults, `${address}-${networkId}`, name);
        else Vue.set(defaults, `${address}-${networkId}`, name);
      },
      setAutoExtend(state, { index, value }) {
        Vue.set(state.owned[index], 'autoExtend', value);
      },
    },
    actions: {
      async fetchOwned({ state: { owned }, rootState, commit, getters: { getDefault }, dispatch }) {
        if (!rootState.middleware) return;
        const getPendingNameClaimTransactions = (address) =>
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

        const defaultName = getDefault(rootState.account.publicKey);
        let defaultNameRevoked = false;
        const names = await Promise.all([
          getPendingNameClaimTransactions(rootState.account.publicKey),
          rootState.middleware.getOwnedBy(rootState.account.publicKey).then(({ active }) =>
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
                    if (revoked) {
                      if (name.name === defaultName) defaultNameRevoked = true;
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
                    }
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
        if ((names.length && !defaultName) || defaultNameRevoked) {
          const claimed = names.filter((n) => !n.pending);
          if (claimed.length)
            dispatch('setDefault', {
              name: claimed[0],
              address: rootState.account.publicKey,
              modal: false,
            });
        }
      },
      async fetchAuctions({ rootState: { middleware } }) {
        if (!middleware) return [];
        return (await middleware.getActiveNameAuctions()).data.map(({ name, info }) => ({
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
        { rootState: { sdk }, commit, dispatch, rootGetters: { activeNetwork } },
        { name, address, modal = true },
      ) {
        commit('setDefault', { name, address, networkId: sdk.getNetworkId() });

        try {
          const response = await postJson(`${activeNetwork.backendUrl}/profile`, {
            body: {
              author: address,
              preferredChainName: name.name,
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
