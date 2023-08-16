import {
  computed,
  ref,
  watch,
} from 'vue';
import { isEqual, uniqWith } from 'lodash-es';
import { Encoded } from '@aeternity/aepp-sdk';

import { IDefaultComposableOptions } from '@/types';
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
import { useTransactionList } from './transactionList';
import { useAeSdk } from './aeSdk';

const isTransactionListLoading = ref(false);

const { onNetworkChange } = createNetworkWatcher();

/**
 * Store the state of the latest transactions to avoid multiple fetching when opening pages
 * that wants to use this data.
 */
export function useLatestTransactionList({ store }: IDefaultComposableOptions) {
  const { accounts } = useAccounts({ store });
  const { balancesTotal } = useBalances({ store });
  const { nodeNetworkId } = useAeSdk({ store });

  const {
    transactions,
    fetchTransactions,
  } = useTransactionList({ store });

  const tokens = computed(() => store.state.fungibleTokens.tokens);

  const latestTransactions = computed(() => {
    const allTransactions = Object.entries(transactions.value)
      .map(([
        accountAddress,
        { loaded, pending }]) => [...(pending[nodeNetworkId.value!] || []), ...(loaded || [])]
        .map((tr) => {
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
        }));

    return uniqWith(allTransactions.flatMap((transaction) => transaction), (a, b) => (
      a.hash === b.hash && a.transactionOwner === b.transactionOwner
    ))
      .sort(sortTransactionsByDateCallback)
      .slice(0, DASHBOARD_TRANSACTION_LIMIT);
  });

  async function updateTransactionListData() {
    if (isTransactionListLoading.value) {
      return;
    }

    isTransactionListLoading.value = true;

    await Promise.all(accounts.value.map(async ({ address }) => {
      try {
        return (await fetchTransactions(
          DASHBOARD_TRANSACTION_LIMIT,
          true,
          address,
        ));
      } catch (e) {
        handleUnknownError(e);
        return [];
      }
    }));

    isTransactionListLoading.value = false;
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
    { immediate: true },
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
    updateTransactionListData();
  });

  return {
    isTransactionListLoading,
    latestTransactions,
  };
}
