import {
  computed,
  ref,
  watch,
} from 'vue';
import { isEqual, uniqWith } from 'lodash-es';
import type {
  IDefaultComposableOptions,
  ITransaction,
  ITransactionsState,
} from '../types';
import {
  DASHBOARD_TRANSACTION_LIMIT,
  MDW_TO_NODE_APPROX_DELAY_TIME,
  sortTransactionsByDateCallback,
  handleUnknownError,
} from '../popup/utils';
import { useAccounts } from './accounts';
import { useBalances } from './balances';
import { createNetworkWatcher } from './composablesHelpers';
import { useTransactionTx } from './transactionTx';
import { useSdk } from './sdk';

const isTransactionListLoading = ref(false);
const fetchedTransactions = ref<ITransaction[]>([]);
const pendingTransactions = ref<ITransaction[]>([]);
const latestTransactions = ref<ITransaction[]>([]);

const { onNetworkChange } = createNetworkWatcher();

/**
 * Store the state of the latest transactions to avoid multiple fetching when opening pages
 * that wants to use this data.
 */
export function useLatestTransactionList({ store }: IDefaultComposableOptions) {
  const { accounts } = useAccounts({ store });
  const { balancesTotal } = useBalances({ store });
  const { nodeNetworkId } = useSdk({ store });

  const tokens = computed(() => store.state.fungibleTokens.tokens);

  const localPendingTransactionsList = computed(
    (): ITransaction[] => (store.state.transactions as ITransactionsState)
      .pending[nodeNetworkId.value!] || [],
  );

  function buildLatestTransactions() {
    pendingTransactions.value = pendingTransactions.value.filter(({ hash }) => (
      !fetchedTransactions.value.some((transaction) => transaction.hash === hash)
    ));

    const transactions: ITransaction[] = [
      ...pendingTransactions.value,
      ...fetchedTransactions.value,
    ];

    latestTransactions.value = uniqWith(transactions, (a, b) => (
      a.hash === b.hash && a.transactionOwner === b.transactionOwner
    ))
      .sort(sortTransactionsByDateCallback)
      .slice(0, DASHBOARD_TRANSACTION_LIMIT);
  }

  async function updateTransactionListData() {
    if (isTransactionListLoading.value) {
      return;
    }

    isTransactionListLoading.value = true;

    fetchedTransactions.value = (await Promise.all(accounts.value.map(async ({ address }) => {
      try {
        return (await store.dispatch('fetchTransactions',
          {
            limit: DASHBOARD_TRANSACTION_LIMIT, address, recent: true, multipleAccounts: true,
          })).map(
          (transaction: ITransaction) => {
            const {
              direction,
            } = useTransactionTx({
              store,
              tx: transaction.tx,
              externalAddress: address,
            });

            return {
              ...transaction,
              direction: direction.value,
            };
          },
        );
      } catch (e) {
        handleUnknownError(e);
        return [];
      }
    }))).flat();

    isTransactionListLoading.value = false;
    buildLatestTransactions();
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
    localPendingTransactionsList,
    (val) => {
      const newPendingTransaction: ITransaction[] = [...pendingTransactions.value];
      val.forEach((transaction) => {
        if (!pendingTransactions.value.some(
          ({ hash }) => hash === transaction.hash,
        )) {
          newPendingTransaction.push(transaction);
        }
      });
      pendingTransactions.value = newPendingTransaction;
      buildLatestTransactions();
    },
    { deep: true, immediate: true },
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
    fetchedTransactions.value = [];
    updateTransactionListData();
  });

  return {
    isTransactionListLoading,
    latestTransactions,
  };
}
