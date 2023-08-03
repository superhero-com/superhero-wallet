import { watch } from 'vue';
import {
  useMiddleware,
  useModals,
  useAeSdk,
  useAccounts,
  useTransactionList,
} from '@/composables';
import {
  fetchAllPages,
  fetchJson,
  postJson,
} from '@/utils';
import { AUTO_EXTEND_NAME_BLOCKS_INTERVAL } from '@/constants';
import {
  checkAddress,
  isInsufficientBalanceError,
  handleUnknownError,
} from '@/popup/utils';
import { isAensNameValid } from '@/protocols/aeternity/helpers';
import { tg } from './languages';

export default (store) => {
  const {
    nodeNetworkId,
    getAeSdk,
    fetchRespondChallenge,
  } = useAeSdk({ store });

  const {
    isMiddlewareReady,
    getMiddleware,
    getMiddlewareRef,
    fetchFromMiddlewareCamelCased,
  } = useMiddleware({ store });

  const {
    fetchPendingTransactions,
  } = useTransactionList({ store });

  const { openDefaultModal } = useModals();

  const { accounts, activeAccount } = useAccounts({ store });

  store.registerModule('names', {
    namespaced: true,
    state: {
      owned: [],
      defaults: {},
      preferred: {},
      auctions: {},
      pendingAutoExtendNames: [],
      areNamesFetching: false,
    },
    getters: {
      get: ({ owned }) => (name) => owned.find((n) => n.name === name),
      getDefault: ({ defaults }) => (address) => {
        if (!defaults) return '';
        return defaults[`${address}-${nodeNetworkId.value}`];
      },
      getPreferred: ({ preferred }, { getDefault }) => (address) => {
        if (activeAccount.value.address === address) {
          return getDefault(address);
        }
        store.dispatch('names/setPreferred', address);
        return preferred[`${address}-${nodeNetworkId.value}`] || '';
      },
      getName: ({ owned }) => (name) => owned.find((n) => n.name === name),
      getAuction: ({ auctions }) => (name) => auctions[name] || null,
      getHighestBid: (_, { getAuction }) => (name) => getAuction(name)
        && getAuction(name).bids.reduce((a, b) => (a.nameFee.isGreaterThan(b.nameFee) ? a : b)),
    },
    mutations: {
      setAreNamesFetching(state, payload) {
        state.areNamesFetching = payload;
      },
      set(state, names) {
        state.owned = names;
      },
      setDefault({ defaults }, { address, name }) {
        if (name) {
          // eslint-disable-next-line no-param-reassign
          defaults[`${address}-${nodeNetworkId.value}`] = name;
        } else {
          // eslint-disable-next-line no-param-reassign
          delete defaults[`${address}-${nodeNetworkId.value}`];
        }
      },
      setAutoExtend(state, { name, value }) {
        const index = state.owned.findIndex((n) => n.name === name);
        state.owned[index].autoExtend = value;
      },
      setPreferred({ preferred }, { address, name }) {
        const key = `${address}-${nodeNetworkId.value}`;
        if (name) {
          // eslint-disable-next-line no-param-reassign
          preferred[key] = name;
        } else {
          // eslint-disable-next-line no-param-reassign
          delete preferred[key];
        }
      },
      setAuctionEntry(state, { name, expiration, bids }) {
        state.auctions[name] = { expiration, bids };
      },
      setPendingAutoExtendName(state, name) {
        state.pendingAutoExtendNames.push(name);
      },
    },
    actions: {
      async fetchOwned({
        state: { owned, pendingAutoExtendNames },
        commit,
      }) {
        commit('setAreNamesFetching', true);
        const fetchPendingNameClaimTransactions = (address) => fetchPendingTransactions(address)
          .then((transactions) => transactions
            .filter(({ tx: { type } }) => type === 'NameClaimTx')
            .map(({ tx, ...otherTx }) => ({
              ...otherTx,
              ...tx,
              owner: tx.accountId,
            })));

        const middleware = await getMiddleware();
        const names = await Promise.all(
          accounts.value.map(({ address }) => Promise.all([
            fetchPendingNameClaimTransactions(address),
            fetchAllPages(
              () => middleware.getNames({ owned_by: address, state: 'active', limit: 100 }),
              fetchFromMiddlewareCamelCased,
            ).then((data) => data.map(({ info, name, hash }) => ({
              createdAtHeight: info.activeFrom,
              expiresAt: info.expireHeight,
              owner: info.ownership.current,
              pointers: info.pointers,
              autoExtend: !!(
                owned.find((n) => n.name === name)?.autoExtend
                || pendingAutoExtendNames?.includes(name)
              ),
              name,
              hash,
            }))),
          ])),
        ).then((arr) => arr.flat(2));

        commit('set', names);
        commit('setAreNamesFetching', false);
      },
      async fetchAuctions() {
        const middleware = await getMiddleware();

        // TODO: Switch to onscroll loading after/while resolving https://github.com/aeternity/superhero-wallet/issues/1400
        return (
          await fetchAllPages(
            () => middleware.getNamesAuctions({ by: 'expiration', direction: 'forward', limit: 100 }),
            fetchFromMiddlewareCamelCased,
          )
        ).map(({ name, info }) => ({
          name,
          expiration: info.auctionEnd,
          lastBid: info.lastBid.tx,
        }));
      },
      async updatePointer(
        _,
        { name, address, type = 'update' },
      ) {
        const aeSdk = await getAeSdk();
        const nameEntry = await aeSdk.aensQuery(name);
        try {
          if (type === 'extend') {
            await nameEntry.extendTtl();
          } else if (type === 'update') {
            await aeSdk.aensUpdate(name, { account_pubkey: address }, { extendPointers: true });
          }
          openDefaultModal({
            msg: tg('pages.names.pointer-added', { type }),
          });
        } catch (e) {
          if (e.message.includes('Account not found')) {
            handleUnknownError(e);
          } else {
            openDefaultModal({
              msg: isInsufficientBalanceError(e)
                ? i18n.t('modals.insufficient-balance.msg')
                : e.message,
            });
          }
        }
      },
      async setDefaults(
        { rootGetters: { activeNetwork }, commit },
      ) {
        await Promise.all(accounts.value.map(async ({ address }) => {
          const response = await fetchJson(
            `${activeNetwork.backendUrl}/profile/${address}`,
          ).catch(() => {});
          commit('setDefault', { address, name: response?.preferredChainName });
        }));
      },
      async setDefault(
        { commit, rootGetters: { activeNetwork } },
        { name, address },
      ) {
        const response = await postJson(`${activeNetwork.backendUrl}/profile/${address}`, {
          body: {
            preferredChainName: name,
          },
        });

        const respondChallenge = await fetchRespondChallenge(response);

        await postJson(`${activeNetwork.backendUrl}/profile/${address}`, {
          body: respondChallenge,
        });
        commit('setDefault', { name, address });
      },
      async getAddress(context, id) {
        if (checkAddress(id)) return id;
        if (isAensNameValid(id)) {
          const middleware = await getMiddleware();
          const { info: nameEntry } = await middleware.getName(id);
          return nameEntry.pointers?.accountPubkey;
        }
        return '';
      },
      async setPreferred({
        rootGetters: { activeNetwork },
        commit,
      }, address) {
        const response = await fetchJson(`${activeNetwork.backendUrl}/profile/${address}`).catch(() => {});
        if (response?.preferredChainName) {
          commit('setPreferred', { address, name: response?.preferredChainName });
        } else {
          commit('setPreferred', { address });
        }
      },
    },
  });

  watch(getMiddlewareRef(), async () => {
    if (isMiddlewareReady.value) {
      const [aeSdk] = await Promise.all([
        getAeSdk(),
        store.dispatch('names/fetchOwned').catch(() => {}),
        store.dispatch('names/setDefaults'),
      ]);

      const height = await aeSdk.getHeight();
      await Promise.all(
        store.state.names.owned
          .filter(({ autoExtend }) => autoExtend)
          .filter(({ expiresAt }) => expiresAt - height < AUTO_EXTEND_NAME_BLOCKS_INTERVAL)
          .map(({ name }) => store.dispatch('names/updatePointer', { name, type: 'extend' })),
      );
    }
  }, { immediate: true, deep: true });

  store.watch(
    ({ accounts: { hdWallet: { nextAccountIdx } } }) => nextAccountIdx,
    async () => {
      if (isMiddlewareReady.value) {
        await Promise.all([
          store.dispatch('names/fetchOwned').catch(() => {}),
          store.dispatch('names/setDefaults'),
        ]);
      }
    },
  );
};
