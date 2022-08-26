export default async (store) => {
  const waitTransactionMined = async ({
    hash, type, amount, tipUrl, recipient: recipientId,
  }) => {
    const network = store.getters.activeNetwork?.networkId;
    try {
      const transaction = await store.state.sdk.poll(hash);
      // TODO - pawel - close tx modal
      const showSpendModal = () => store.dispatch('modals/open', {
        name: 'spend-success',
        transaction: { ...transaction, tipUrl, ...type === 'spendToken' ? { tx: { ...transaction.tx, recipientId, amount } } : {} },
      });
      switch (type) {
        case 'tip':
        case 'spend':
          showSpendModal();
          break;
        case 'spendToken':
          store.dispatch('fungibleTokens/loadTokenBalances');
          showSpendModal();
          break;
        default:
      }
      store.commit('setPendingTransactionSentByHash', { hash, network });
    } catch (e) {
      store.commit('removePendingTransactionByHash', { hash, network });
    }
  };
  // eslint-disable-next-line no-underscore-dangle
  await store._watcherVM.$watchUntilTruly(() => store.state.sdk);
  // eslint-disable-next-line no-unused-expressions
  store.state.transactions.pending[store.getters.activeNetwork?.networkId]
    ?.filter(({ sent = false }) => !sent).forEach((t) => {
      if (Date.now() - t.microTime > 600000) {
        store.commit('removePendingTransactionByHash',
          { hash: t.hash, network: store.getters.activeNetwork?.networkId });
      } else {
        waitTransactionMined(t);
      }
    });

  store.subscribe(async (mutation) => {
    if (mutation.type !== 'addPendingTransaction') return;
    await waitTransactionMined(mutation.payload.transaction);
  });
};
