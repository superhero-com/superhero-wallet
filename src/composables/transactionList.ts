import { computed, ref } from 'vue';
import type {
  AccountAddress,
  AssetContractId,
  ICommonTransaction,
  ITransactionApiPaginationParams,
  Protocol,
} from '@/types';
import { POLLING_INTERVAL_TRANSACTIONS, STORAGE_KEYS } from '@/constants';
import { objectHasNonEmptyProperties } from '@/utils';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';
import { useConnection } from './connection';
import { useUi } from './ui';
import { useStorageRef } from './storageRef';
import { useNetworks } from './networks';
import { useLatestTransactionList } from './latestTransactionList';

interface UseTransactionListOptions {
  accountAddress: AccountAddress;
  /**
   * Decides whether all transactions for the account (undefined)
   * or only one asset are to be fetched and stored.
   */
  assetContractId?: AssetContractId;
  protocol: Protocol;
}

/**
 * `accountAddress`, `assetContractId` and `networkName` are used to determine
 * if the cached list should be cleared and fetched again.
 */
const state = useStorageRef<{
  accountAddress?: AccountAddress;
  assetContractId?: AssetContractId;
  isEndReached: boolean;
  isInitialLoadDone: boolean;
  networkName?: string;
  nextPagePaginationParams: ITransactionApiPaginationParams;
  transactionsLoaded: ICommonTransaction[];
}>(
  {
    isEndReached: false,
    isInitialLoadDone: false,
    nextPagePaginationParams: {},
    transactionsLoaded: [],
  },
  STORAGE_KEYS.transactionsLoaded,
);

let pollingIntervalId: NodeJS.Timer;

const isLoading = ref(false);

const isEndReached = computed(() => state.value.isEndReached);
const transactionsLoaded = computed(() => state.value.transactionsLoaded);

/**
 * Manages the state of transaction list for the components. Allows to cache the results
 * when switching between pages or closing and opening the extension window.
 * The list is stored only for one account and list type (assetContractId).
 * Whenever different list type accesses the list the cache is cleared and the results
 * are fetched again.
 */
export function useTransactionList({
  accountAddress,
  assetContractId,
  protocol,
}: UseTransactionListOptions) {
  const { isOnline } = useConnection();
  const { isAppActive } = useUi();
  const { activeNetwork } = useNetworks();
  const { accountsTransactionsPending } = useLatestTransactionList();

  const adapter = ProtocolAdapterFactory.getAdapter(protocol);

  const transactionsPending = computed(
    () => (accountsTransactionsPending.value[accountAddress] || [])
      .filter(({ tx }) => tx?.contractId === assetContractId),
  );

  const transactionsLoadedAndPending = computed(() => [
    ...transactionsPending.value,
    ...transactionsLoaded.value,
  ]);

  function fetchTransactions(paginationParams?: ITransactionApiPaginationParams) {
    return (assetContractId)
      ? adapter.fetchAccountAssetTransactions(accountAddress, assetContractId, paginationParams)
      : adapter.fetchAccountTransactions(accountAddress, paginationParams);
  }

  async function loadCurrentPageTransactions() {
    if (isOnline.value && !isLoading.value && !state.value.isEndReached) {
      isLoading.value = true;

      const {
        paginationParams,
        regularTransactions,
      } = await fetchTransactions(state.value.nextPagePaginationParams);

      if (objectHasNonEmptyProperties(paginationParams)) {
        state.value.nextPagePaginationParams = paginationParams;
      } else {
        state.value.isEndReached = true;
      }

      if (regularTransactions?.length) {
        if (state.value.isInitialLoadDone) {
          state.value.transactionsLoaded.push(...regularTransactions);
        } else {
          state.value.transactionsLoaded = regularTransactions;
        }
      }

      isLoading.value = false;
      state.value.isInitialLoadDone = true;
    }
  }

  async function initializeTransactionListPolling() {
    if (!state.value.isInitialLoadDone || !transactionsLoaded.value.length) {
      await loadCurrentPageTransactions();
    }

    pollingIntervalId = setInterval(async () => {
      if (isAppActive.value) {
        const { paginationParams, regularTransactions } = await fetchTransactions();

        // If newly fetched first transaction is different than the first transaction stored
        // it means that the list and the pagination params needs to be reset.
        if (
          regularTransactions?.length
          && regularTransactions?.[0]?.hash !== state.value.transactionsLoaded?.[0]?.hash
        ) {
          state.value.transactionsLoaded = regularTransactions;
          state.value.nextPagePaginationParams = paginationParams;
          state.value.isEndReached = false;
        }
      }
    }, POLLING_INTERVAL_TRANSACTIONS);
  }

  function stopTransactionListPolling() {
    clearInterval(pollingIntervalId);
  }

  (async () => {
    // Clear cached states if app wants to access different asset list
    if (
      accountAddress !== state.value.accountAddress
      || assetContractId !== state.value.assetContractId
      || activeNetwork.value.name !== state.value.networkName
    ) {
      stopTransactionListPolling(); // Ensure previous polling is reset

      state.value = {
        accountAddress,
        assetContractId,
        isEndReached: false,
        isInitialLoadDone: false,
        networkName: activeNetwork.value.name,
        nextPagePaginationParams: {},
        transactionsLoaded: [],
      };
    }
  })();

  return {
    isLoading,
    isEndReached,
    transactionsLoaded,
    transactionsLoadedAndPending,
    fetchTransactions,
    loadCurrentPageTransactions,
    initializeTransactionListPolling,
    stopTransactionListPolling,
  };
}
