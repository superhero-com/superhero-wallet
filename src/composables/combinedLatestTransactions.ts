import { computed } from '@vue/composition-api';
import { ITransaction } from '../types';
import store from '../store';
import {
  COUNT_OF_DASHBOARD_TRANSACTION,
  sortTransaction,
} from '../popup/utils';

export const useCombinedLatestTransactions = () => {
  const transactions = computed<Record<string, ITransaction[]>>(
    () => (store as any).state?.fungibleTokens?.transactions,
  );
  const latestTransactions = computed(() => {
    const allTransactions = Object.values(transactions.value).flatMap((t) => t);
    return allTransactions.sort(sortTransaction).slice(0, COUNT_OF_DASHBOARD_TRANSACTION);
  });

  return {
    latestTransactions,
  };
};
