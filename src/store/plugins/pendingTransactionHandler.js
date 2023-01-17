import { MODAL_SPEND_SUCCESS, watchUntilTruthy } from '../../popup/utils';

export default async (store) => {
  const waitTransactionMined = async ({
    hash, type = null, amount, tipUrl,
    recipient: recipientId, ...pendingTransaction
  }) => {
    const network = store.getters.activeNetwork?.networkId;
    try {
      const transaction = await store.getters['sdkPlugin/sdk'].poll(hash);

      if (type) {
        if (type === 'spendToken') store.dispatch('fungibleTokens/loadTokenBalances');
        store.dispatch('modals/open', {
          name: MODAL_SPEND_SUCCESS,
          transaction: {
            tipUrl,
            type,
            amount,
            ...pendingTransaction,
            ...transaction,
            ...(type === 'spendToken')
              ? { tx: { ...transaction.tx, recipientId, amount } }
              : {},
          },
        });
      }
      store.commit('setPendingTransactionSentByHash', { hash, network });
    } catch (e) {
      store.commit('removePendingTransactionByHash', { hash, network });
    }
  };

  await watchUntilTruthy(() => store.getters['sdkPlugin/sdk']);

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
