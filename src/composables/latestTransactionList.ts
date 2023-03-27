import { computed, ref, watch } from '@vue/composition-api';
import { isEqual, uniqWith } from 'lodash-es';
import type { IDefaultComposableOptions, ITransaction } from '../types';
import {
  DASHBOARD_TRANSACTION_LIMIT,
  MDW_TO_NODE_APPROX_DELAY_TIME,
  defaultTransactionSortingCallback,
  handleUnknownError,
} from '../popup/utils';
import { useMiddleware } from './middleware';
import { useAccounts } from './accounts';
import { useBalances } from './balances';
import { createNetworkWatcher } from './composablesHelpers';

// eslint-disable-next-line no-unused-vars
type TransactionFetchCallbackFunction = (address: string)
  => Promise<ITransaction[] | { data: ITransaction[]}>;

const isTransactionListLoading = ref(false);
const transactionList = ref<ITransaction[]>([]);
let initialUpdateDone = false;

const { onNetworkChange } = createNetworkWatcher();

/**
 * Store the state of the latest transactions to avoid multiple fetching when opening pages
 * that wants to use this data.
 */
export function useLatestTransactionList({ store }: IDefaultComposableOptions) {
  const { getMiddleware } = useMiddleware({ store });
  const { accounts } = useAccounts({ store });
  const { balancesTotal } = useBalances({ store });
  const tokens = computed(() => store.state.fungibleTokens.tokens);

  async function fetchTxByAccountAddress(address: string) {
    const middleware = await getMiddleware();
    return middleware.getTxByAccount(address, DASHBOARD_TRANSACTION_LIMIT, 1);
  }

  function fetchPendingTransactionsByAddress(address: string) {
    return store.dispatch('fetchPendingTransactions', address);
  }

  function fetchTokensHistoryByAddress(address: string) {
    return store.dispatch('fungibleTokens/getTokensHistory', {
      address, multipleAccounts: true,
    });
  }

  function fetchTipWithdrawnTransactionsByAddress(address: string) {
    return store.dispatch('fetchTipWithdrawnTransactions', {
      address, multipleAccounts: true, recent: true, limit: DASHBOARD_TRANSACTION_LIMIT,
    });
  }

  /**
   * TODO actually each of the functions we pass here returns different structure than ITransaction
   */
  function fetchForAllAccounts(func: TransactionFetchCallbackFunction): Promise<ITransaction[]>[] {
    return accounts.value.map(async ({ address }) => {
      try {
        const res = await func(address);
        return (Array.isArray(res) ? res : res?.data).map(
          (transaction: ITransaction) => ({
            ...transaction,
            transactionOwner: address,
          }),
        );
      } catch (e) {
        handleUnknownError(e);
        return [];
      }
    });
  }

  /**
   * This action is really heavy as we are fetching four lists for each of the accounts.
   * TODO: Replace this with WebSockets and leave only the initial call.
   */
  async function updateTransactionListData() {
    if (isTransactionListLoading.value) {
      return;
    }

    isTransactionListLoading.value = true;

    const allTransactionsPromises = [
      ...fetchForAllAccounts(fetchTxByAccountAddress),
      ...fetchForAllAccounts(fetchPendingTransactionsByAddress),
      ...fetchForAllAccounts(fetchTokensHistoryByAddress),
      ...fetchForAllAccounts(fetchTipWithdrawnTransactionsByAddress),
    ];

    const allTransactions = await Promise.all(allTransactionsPromises);

    transactionList.value = uniqWith(allTransactions.flat(), (a, b) => (
      a.hash === b.hash && a.transactionOwner === b.transactionOwner
    ))
      .sort(defaultTransactionSortingCallback)
      .slice(0, DASHBOARD_TRANSACTION_LIMIT);

    isTransactionListLoading.value = false;
    initialUpdateDone = true;
  }

  if (!initialUpdateDone && !isTransactionListLoading.value) {
    updateTransactionListData();
  }

  /**
   * To avoid unnecessary data transfers instead of constant polling
   * we are fetching the transactions only if the total balance of the accounts changes.
   */
  watch(
    balancesTotal,
    (val, oldVal) => {
      if (val !== oldVal) {
        setTimeout(() => updateTransactionListData(), MDW_TO_NODE_APPROX_DELAY_TIME);
      }
    },
  );

  watch(
    tokens,
    (oldTokens, newTokens) => {
      if (!isEqual(oldTokens, newTokens)) {
        updateTransactionListData();
      }
    },
    { deep: true },
  );

  onNetworkChange(store, () => {
    transactionList.value = [];
    updateTransactionListData();
  });

  return {
    isTransactionListLoading,
    transactionList,
    updateTransactionListData,
  };
}
