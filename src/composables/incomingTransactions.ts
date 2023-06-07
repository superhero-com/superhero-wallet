import { useRouter } from 'vue-router';
import { roundAmountToPrecision } from '../popup/utils';
import { i18n } from '../store/plugins/languages';
import { IDefaultComposableOptions, ITransaction } from '../types';
import { useAccounts } from './accounts';
import { useNotifications } from './notifications';
import { useGetter } from './vuex';
import { ROUTE_TX_DETAILS } from '../popup/router/routeNames';
import WebSocketClient from '../lib/WebSocketClient';

export function useIncomingTransactions({ store }: IDefaultComposableOptions) {
  const router = useRouter();

  const { addWalletNotification } = useNotifications({ store });
  const { isLocalAccountAddress, getAccountNameByAddress, accounts } = useAccounts({ store });
  const getTxAmountTotal = useGetter<any>('getTxAmountTotal');
  const getTxSymbol = useGetter<any>('getTxSymbol');
  let unWatchAccountsUpdates: (() => void)[] = [];

  /**
   * This function starts listening for incoming transactions on the 'Transactions' channel.
   */
  function startListeningForIncomingTransactions() {
    const receivedTransactions = new Set<string>();

    unWatchAccountsUpdates = accounts.value.map(
      (account) => WebSocketClient.subscribeForAccountUpdates(
        account.address,
        (transaction: ITransaction) => {
          if (!transaction?.tx) return;
          const { hash, tx: { senderId, recipientId } } = transaction;

          if (
            recipientId
            && isLocalAccountAddress(recipientId)
            && !receivedTransactions.has(hash)
          ) {
            receivedTransactions.add(hash);

            const amount = roundAmountToPrecision(getTxAmountTotal.value(transaction));
            const title = i18n.t('pages.notifications.incomingTransaction');
            const text = `${getAccountNameByAddress(recipientId)} ${i18n.t('pages.transactions.received')} ${amount} ${getTxSymbol.value(transaction)}`;

            addWalletNotification({
              id: hash,
              text,
              title,
              buttonLabel: i18n.t('pages.notifications.viewTransaction'),
              path: router.resolve({ name: ROUTE_TX_DETAILS, params: { hash } }).href,
              sender: senderId,
              receiver: recipientId,
              hasIncomingTransaction: true,
              pushNotification: true,
            });
          }
        },
      ),
    );
  }

  function stopListeningForIncomingTransactions() {
    unWatchAccountsUpdates.forEach((unWatch) => unWatch());
  }

  return {
    startListeningForIncomingTransactions,
    stopListeningForIncomingTransactions,
  };
}
