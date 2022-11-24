import { useModals, useSdk } from '../../composables';
import { MODAL_SPEND_SUCCESS } from '../../popup/utils';

export default async (store) => {
  const { openModal } = useModals();

  const waitTransactionMined = async ({
    hash, type, tipUrl, recipient: recipientId, tx, ...otherTx
  }) => {
    const { getSdk } = useSdk({ store });
    const network = store.getters.activeNetwork?.networkId;
    const sdk = await getSdk();

    try {
      const transaction = await sdk.poll(hash);
      const showSpendModal = () => openModal(MODAL_SPEND_SUCCESS, {
        name: MODAL_SPEND_SUCCESS,
        transaction: {
          tipUrl,
          ...otherTx,
          ...transaction,
          ...(type === 'spendToken')
            ? { tx: { ...transaction.tx, recipientId, amount: tx.amount } }
            : {},
        },
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
