import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { Encoded } from '@aeternity/aepp-sdk-13';
import { TX_FUNCTIONS, TX_TYPE_MDW, roundAmountToPrecision } from '../popup/utils';
import { IDefaultComposableOptions, ITransaction } from '../types';
import { useAccounts } from './accounts';
import { useNotifications } from './notifications';
import { useGetter } from './vuex';
import { ROUTE_TX_DETAILS } from '../popup/router/routeNames';
import WebSocketClient from '../lib/WebSocketClient';

export function useIncomingTransactions({ store }: IDefaultComposableOptions) {
  const router = useRouter();
  const { t } = useI18n();

  const { addWalletNotification } = useNotifications({ store });
  const { isLocalAccountAddress, getAccountByAddress, accounts } = useAccounts({ store });
  const getTxAmountTotal = useGetter<any>('getTxAmountTotal');
  const getTxSymbol = useGetter<any>('getTxSymbol');
  let unWatchAccountsUpdates: (() => void)[] = [];

  /**
   * @param {Encoded.AccountAddress} address - the address to format.
   * @returns {string} - returns the account's name if it exists,
   * otherwise it returns the translated string "Account" + the account's index +1.
  */
  function getAccountNameByAddress(address: Encoded.AccountAddress): string {
    const { idx, name } = getAccountByAddress(address) || {};

    if (name) {
      return name;
    }

    if (idx) {
      return `${t('pages.account.heading')} ${idx + 1}`;
    }

    return address;
  }

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
          const { hash, tx } = transaction;
          let { senderId, recipientId } = tx;

          if (
            TX_TYPE_MDW[tx.type] === TX_TYPE_MDW.ContractCallTx
            && tx.function === TX_FUNCTIONS.transfer
          ) {
            senderId = tx.callerId;
            recipientId = tx.arguments.find((arg) => arg.type === 'address')?.value;
          } else if (TX_TYPE_MDW[tx.type] !== TX_TYPE_MDW.SpendTx) {
            return;
          }

          if (
            recipientId
            && isLocalAccountAddress(recipientId as Encoded.AccountAddress)
            && !receivedTransactions.has(hash)
          ) {
            receivedTransactions.add(hash);

            const amount = roundAmountToPrecision(getTxAmountTotal.value(transaction));
            const title = t('pages.notifications.incomingTransaction');
            const text = `${getAccountNameByAddress(recipientId as Encoded.AccountAddress)} ${t('pages.transactions.received')} ${amount} ${getTxSymbol.value(transaction)}`;

            addWalletNotification({
              id: hash,
              text,
              title,
              buttonLabel: t('pages.notifications.viewTransaction'),
              path: router.resolve({
                name: ROUTE_TX_DETAILS,
                params: {
                  hash,
                  transactionOwner: recipientId,
                },
              }).href,
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
