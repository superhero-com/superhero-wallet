import Vue from 'vue';

export default store =>
  store.registerModule('names', {
    namespaced: true,
    state: {
      all: [],
      defaults: {},
    },
    getters: {
      getDefault: ({ defaults }, getters, { sdk }) => address =>
        sdk ? defaults[`${address}-${sdk.getNetworkId()}`] : undefined,
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
        if (names.length && !defaultName)
          dispatch('setDefault', { name: names[0].name, address: rootState.account.publicKey });
      },
      setDefault({ rootState: { sdk }, commit }, { name, address }) {
        commit('setDefault', { name, address, networkId: sdk.getNetworkId() });
      },
    },
  });
