import {
  computed,
  ref,
  watch,
} from 'vue';
import { isEqual } from 'lodash-es';
import { Encoded } from '@aeternity/aepp-sdk';
import type { IDefaultComposableOptions, ITransaction } from '@/types';
import { DASHBOARD_TRANSACTION_LIMIT, PROTOCOL_AETERNITY, PROTOCOL_BITCOIN } from '@/constants';
import {
  handleUnknownError,
  pipe,
  removeDuplicatedTransactions,
  sortTransactionsByDate,
} from '@/utils';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';
import { AE_MDW_TO_NODE_APPROX_DELAY_TIME } from '@/protocols/aeternity/config';
import { useAccounts } from './accounts';
import { useBalances } from './balances';
import { useTransactionTx } from './transactionTx';
import { useTransactionList } from './transactionList';
import { useAeSdk } from './aeSdk';
import { createNetworkWatcher } from './networks';

const isTransactionListLoading = ref(false);

const { onNetworkChange } = createNetworkWatcher();

/**
 * Store the state of the latest transactions to avoid multiple fetching when opening pages
 * that wants to use this data.
 */
export function useLatestTransactionList({ store }: IDefaultComposableOptions) {
  const { accounts } = useAccounts();
  const { accountsTotalBalance } = useBalances();
  const { nodeNetworkId } = useAeSdk({ store });

  const {
    transactions,
    fetchTransactions,
  } = useTransactionList({ store });

  const btcTransactions = ref<ITransaction[]>([]);

  const tokens = computed(() => store.state.fungibleTokens.tokens);

  const latestTransactions = computed(() => {
    const aeTransactions = Object.entries(transactions.value)
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
        }))
      .flatMap((transaction) => transaction);

    const allTransactions: ITransaction[] = [
      ...aeTransactions,
      ...btcTransactions.value,
    ];

    return pipe([
      removeDuplicatedTransactions,
      sortTransactionsByDate,
    ])(allTransactions)
      .slice(0, DASHBOARD_TRANSACTION_LIMIT);
  });

  /**
   * TODO The logic here should be updated as it mixes different approaches for each protocol
   */
  async function updateTransactionListData() {
    if (isTransactionListLoading.value) {
      return;
    }

    isTransactionListLoading.value = true;

    const btcAdapter = ProtocolAdapterFactory.getAdapter(PROTOCOL_BITCOIN);

    await Promise.all(accounts.value.map(async ({ address, protocol }) => {
      switch (protocol) {
        case PROTOCOL_AETERNITY:
          try {
            await fetchTransactions(
              DASHBOARD_TRANSACTION_LIMIT,
              true,
              address,
            );
          } catch (error) {
            handleUnknownError(error);
          }
          break;
        case PROTOCOL_BITCOIN:
          try {
            btcTransactions.value = await btcAdapter.fetchTransactions(address);
          } catch (error) {
            handleUnknownError(error);
          }
          break;
        default:
      }
      return true;
    }));

    isTransactionListLoading.value = false;
  }

  /**
   * To avoid unnecessary data transfers instead of constant polling
   * we are fetching the transactions only if the total balance of the accounts changes.
   */
  watch(
    accountsTotalBalance,
    (val, oldVal) => {
      if (val !== oldVal) {
        setTimeout(() => updateTransactionListData(), AE_MDW_TO_NODE_APPROX_DELAY_TIME);
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

  onNetworkChange(() => {
    updateTransactionListData();
  });

  return {
    isTransactionListLoading,
    latestTransactions,
  };
}
