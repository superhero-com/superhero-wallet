import { useSdk } from '../../composables';
import { watchUntilTruthy } from '../../popup/utils';

export default async (store) => {
  const { nodeNetworkId } = useSdk({ store });

  const waitTransactionMined = async ({
    hash,
  }) => {
    try {
      await store.getters['sdkPlugin/sdk'].poll(hash);
      store.commit('setPendingTransactionSentByHash', { hash, network: nodeNetworkId.value });
    } catch (e) {
      store.commit('removePendingTransactionByHash', { hash, network: nodeNetworkId.value });
    }
  };

  await watchUntilTruthy(() => store.state.sdkPlugin.ready);

  // eslint-disable-next-line no-unused-expressions
  store.state.transactions.pending[nodeNetworkId.value]
    ?.filter(({ sent = false }) => !sent).forEach((t) => {
      if (Date.now() - t.microTime > 600000) {
        store.commit('removePendingTransactionByHash', {
          hash: t.hash,
          network: nodeNetworkId.value,
        });
      } else {
        waitTransactionMined(t);
      }
    });

  store.subscribe(async (mutation) => {
    if (mutation.type !== 'addPendingTransaction') return;
    await waitTransactionMined(mutation.payload.transaction);
  });
};
