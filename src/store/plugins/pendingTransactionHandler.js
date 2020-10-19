export default store => {
  const waitTransactionMined = async ({ hash, type, amount, tipUrl }) => {
    try {
      const transaction = await store.state.sdk.poll(hash);
      switch (type) {
        case 'tip':
          store.dispatch('router/push', { name: 'success-tip', params: { amount, tipUrl } });
          break;
        case 'spend':
          store.dispatch('router/push', {
            name: 'send',
            params: { redirectstep: 3, successtx: transaction },
          });
          break;
        default:
      }
    } finally {
      store.commit('removePendingTransactionByHash', hash);
    }
  };

  store.state.transactions.pending.forEach(waitTransactionMined);

  store.registerModule('pending-transactions', {
    actions: {
      async handlePendingTransaction({ commit }, transaction) {
        commit('addPendingTransaction', transaction);
        waitTransactionMined(transaction);
      },
    },
  });
};
