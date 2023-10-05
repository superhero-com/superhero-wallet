import {
  computed,
  ref,
} from 'vue';
import { Encoded } from '@aeternity/aepp-sdk';
import type { IDefaultComposableOptions, ITransaction } from '@/types';
import { DASHBOARD_TRANSACTION_LIMIT } from '@/constants';
import {
  pipe,
  removeDuplicatedTransactions,
  sortTransactionsByDate,
} from '@/utils';
import { useTransactionTx } from './transactionTx';
import { useTransactionList } from './transactionList';

const isTransactionListLoading = ref(false);

/**
 * Store the state of the latest transactions to avoid multiple fetching when opening pages
 * that wants to use this data.
 */
export function useLatestTransactionList({ store }: IDefaultComposableOptions) {
  const {
    transactions,
  } = useTransactionList({ store });

  const latestTransactions = computed(() => {
    const allTransactions = Object.entries(transactions.value)
      .map(([
        accountAddress,
        { loaded, localPendingTransaction }]) => {
        const transactionsList: ITransaction[] = [];
        if (localPendingTransaction) {
          transactionsList.push(localPendingTransaction);
        }
        transactionsList.push(...loaded);

        return transactionsList.map((tr) => {
          const {
            direction,
          } = useTransactionTx({
            store,
            tx: tr.tx,
            externalAddress: accountAddress as Encoded.AccountAddress,
          });
          return {
            ...tr,
            direction: direction.value,
          };
        });
      })
      .flatMap((transaction) => transaction);

    return pipe([
      removeDuplicatedTransactions,
      sortTransactionsByDate,
    ])(allTransactions)
      .slice(0, DASHBOARD_TRANSACTION_LIMIT);
  });

  return {
    isTransactionListLoading,
    latestTransactions,
  };
}
