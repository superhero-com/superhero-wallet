import { computed, ref, watch } from '@vue/composition-api';
import { isEqual, uniqWith } from 'lodash-es';
import type { IDefaultComposableOptions, ITransaction } from '../types';
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

const isTransactionListLoading = ref(false);
const transactionList = ref<ITransaction[]>([]);
let initialUpdateDone = false;

const { onNetworkChange } = createNetworkWatcher();

/**
 * Store the state of the latest transactions to avoid multiple fetching when opening pages
 * that wants to use this data.
 */
export function useLatestTransactionList({ store }: IDefaultComposableOptions) {
  const { accounts } = useAccounts({ store });
  const { balancesTotal } = useBalances({ store });

  const tokens = computed(() => store.state.fungibleTokens.tokens);

  async function updateTransactionListData() {
    if (isTransactionListLoading.value) {
      return;
    }

    isTransactionListLoading.value = true;

    const allTransactions = await Promise.all(accounts.value.map(async ({ address }) => {
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
    }));

    transactionList.value = uniqWith(allTransactions.flat(), (a, b) => (
      a.hash === b.hash && a.transactionOwner === b.transactionOwner
    ))
      .sort(sortTransactionsByDateCallback)
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
