import { computed, ref } from 'vue';
import { uniqBy } from 'lodash-es';
import type {
  AccountAddress,
  AssetContractId,
  ICommonTransaction,
  IFetchTransactionResult,
  ITransactionApiPaginationParams,
  Protocol,
} from '@/types';
import { POLLING_INTERVAL_TRANSACTIONS, STORAGE_KEYS } from '@/constants';
import { handleUnknownError, objectHasNonEmptyProperties } from '@/utils';
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
  let pollingIntervalId: NodeJS.Timeout | undefined;
  /** Time before which a failed page is not requested again */
  let retryAfter = 0;
  const isLoading = ref(false);

  const { isOnline } = useConnection();
  const { isAppActive } = useUi();
  const { activeNetwork } = useNetworks();
  const { accountsTransactionsLatest, accountsTransactionsPending } = useLatestTransactionList();

  const adapter = ProtocolAdapterFactory.getAdapter(protocol);

  const transactionsPending = computed(
    () => (accountsTransactionsPending.value[accountAddress] || [])
      .filter(({ tx }) => tx?.contractId === assetContractId),
  );

  const transactionsLoadedAndPending = computed(() => uniqBy([
    ...transactionsPending.value,
    // Latest cache is account-wide; skip it on asset-specific lists.
    ...(assetContractId ? [] : (accountsTransactionsLatest.value[accountAddress] || [])),
    ...transactionsLoaded.value,
  ].filter(({ protocol: transactionProtocol }) => transactionProtocol === protocol), 'hash'));

  function resetState() {
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

  /** Another list (account, asset or network) uses the shared state */
  function isStateOfAnotherList() {
    return accountAddress !== state.value.accountAddress
      || assetContractId !== state.value.assetContractId
      || activeNetwork.value.name !== state.value.networkName;
  }

  function fetchTransactions(paginationParams?: ITransactionApiPaginationParams) {
    return (assetContractId)
      ? adapter.fetchAccountAssetTransactions(accountAddress, assetContractId, paginationParams)
      : adapter.fetchAccountTransactions(accountAddress, paginationParams);
  }

  async function loadCurrentPageTransactions() {
    if (
      !isOnline.value
      || isLoading.value
      || state.value.isEndReached
      || Date.now() < retryAfter
      // Load-more fires again when `isLoading` turns false, a discarded page would loop
      || isStateOfAnotherList()
    ) {
      return;
    }
    isLoading.value = true;

    try {
      const {
        paginationParams,
        regularTransactions,
        pendingTransactions,
      } = await fetchTransactions(state.value.nextPagePaginationParams);

      if (isStateOfAnotherList()) {
        return;
      }

      // Collect every field update into one object so the `useStorageRef` deep
      // watcher (and its JSON.stringify + localStorage write) fires once per
      // page load instead of once per field.
      const next = { ...state.value };

      if (objectHasNonEmptyProperties(paginationParams)) {
        next.nextPagePaginationParams = paginationParams;
      } else {
        next.isEndReached = true;
      }

      if (
        regularTransactions?.length
        || pendingTransactions?.length
      ) {
        next.transactionsLoaded = uniqBy(
          [
            ...(state.value.isInitialLoadDone ? state.value.transactionsLoaded : []),
            ...regularTransactions,
            ...(pendingTransactions || []),
          ],
          'hash',
        );
      }

      next.isInitialLoadDone = true;
      state.value = next;
    } catch (error) {
      handleUnknownError(error);
      // Load-more fires again as soon as `isLoading` turns false
      retryAfter = Date.now() + POLLING_INTERVAL_TRANSACTIONS;
    } finally {
      isLoading.value = false;
    }
  }

  async function initializeTransactionListPolling() {
    if (!state.value.isInitialLoadDone || !transactionsLoaded.value.length) {
      if (state.value.isInitialLoadDone && !transactionsLoaded.value.length) {
        resetState();
      }
      await loadCurrentPageTransactions();
      if (isStateOfAnotherList()) {
        return;
      }
    }

    pollingIntervalId = setInterval(async () => {
      // The check after the request isn't reached while requests fail
      if (isStateOfAnotherList()) {
        clearInterval(pollingIntervalId);
        return;
      }
      if (isAppActive.value) {
        let response: IFetchTransactionResult;
        try {
          response = await fetchTransactions();
        } catch (error) {
          handleUnknownError(error);
          return;
        }
        const {
          paginationParams,
          regularTransactions,
          pendingTransactions,
        } = response;

        if (isStateOfAnotherList()) {
          clearInterval(pollingIntervalId);
          return;
        }

        const filteredLoadedTransactions = (state.value.transactionsLoaded as any)
          .filter(({ claim = false, pending = false }) => !claim && !pending);

        // If newly fetched first transaction is different than the first transaction stored
        // it means that the list and the pagination params needs to be reset.
        if (
          regularTransactions?.length
          && regularTransactions?.[0]?.hash !== filteredLoadedTransactions?.[0]?.hash
        ) {
          state.value = {
            ...state.value,
            transactionsLoaded: [
              ...regularTransactions,
              ...(pendingTransactions || []),
            ],
            nextPagePaginationParams: paginationParams,
            isEndReached: false,
            // Also when the first load failed
            isInitialLoadDone: true,
          };
        }
      }
    }, POLLING_INTERVAL_TRANSACTIONS);
  }

  function stopTransactionListPolling() {
    clearInterval(pollingIntervalId);
  }

  if (isStateOfAnotherList()) {
    resetState();
  }

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
