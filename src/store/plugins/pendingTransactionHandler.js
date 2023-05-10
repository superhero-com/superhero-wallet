import { useModals, useSdk } from '../../composables';
import { MODAL_SPEND_SUCCESS } from '../../popup/utils';

export default async (store) => {
  const { nodeNetworkId, getSdk } = useSdk({ store });
  const { openModal } = useModals();

  const waitTransactionMined = async ({
    hash, type, tipUrl, recipient: recipientId, tx, ...otherTx
  }) => {
    try {
      const transaction = await store.getters['sdkPlugin/sdk'].poll(hash);
      const showSpendModal = () => openModal(MODAL_SPEND_SUCCESS, {
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
      store.commit('setPendingTransactionSentByHash', { hash, network: nodeNetworkId.value });
    } catch (e) {
      store.commit('removePendingTransactionByHash', { hash, network: nodeNetworkId.value });
    }
  };

  await getSdk();

  // eslint-disable-next-line no-unused-expressions
  store.state.transactions.pending[nodeNetworkId.value]
    ?.filter(({ sent = false }) => !sent).forEach((t) => {
      if (Date.now() - t.microTime > 600000) {
        store.commit('removePendingTransactionByHash',
          { hash: t.hash, network: nodeNetworkId.value });
      } else {
        waitTransactionMined(t);
      }
    });

  store.subscribe(async (mutation) => {
    if (mutation.type !== 'addPendingTransaction') return;
    await waitTransactionMined(mutation.payload.transaction);
  });
};
