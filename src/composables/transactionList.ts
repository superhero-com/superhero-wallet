import { computed, ref } from 'vue';
import { uniqBy } from 'lodash-es';
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
  const isLoading = ref(false);

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
        pendingTransactions,
        tipWithdrawnTransactions,
      } = await fetchTransactions(state.value.nextPagePaginationParams);

      if (accountAddress !== state.value.accountAddress
        || assetContractId !== state.value.assetContractId
        || activeNetwork.value.name !== state.value.networkName) {
        return;
      }

      if (objectHasNonEmptyProperties(paginationParams)) {
        state.value.nextPagePaginationParams = paginationParams;
      } else {
        state.value.isEndReached = true;
      }

      if (
        regularTransactions?.length
        || pendingTransactions?.length
        || tipWithdrawnTransactions?.length
      ) {
        state.value.transactionsLoaded = uniqBy(
          [
            ...(state.value.isInitialLoadDone ? state.value.transactionsLoaded : []),
            ...regularTransactions,
            ...(pendingTransactions || []),
            ...(tipWithdrawnTransactions || []),
          ],
          'hash',
        );
      }

      isLoading.value = false;
      state.value.isInitialLoadDone = true;
    }
  }

  async function initializeTransactionListPolling() {
    if (!state.value.isInitialLoadDone || !transactionsLoaded.value.length) {
      if (state.value.isInitialLoadDone && !transactionsLoaded.value.length) {
        resetState();
      }
      await loadCurrentPageTransactions();
      if (
        accountAddress !== state.value.accountAddress
        || assetContractId !== state.value.assetContractId
        || activeNetwork.value.name !== state.value.networkName
      ) {
        isLoading.value = false;
        return;
      }
    }

    pollingIntervalId = setInterval(async () => {
      if (isAppActive.value) {
        const {
          paginationParams,
          regularTransactions,
          pendingTransactions,
          tipWithdrawnTransactions,
        } = await fetchTransactions();

        if (accountAddress !== state.value.accountAddress
          || assetContractId !== state.value.assetContractId
          || activeNetwork.value.name !== state.value.networkName) {
          isLoading.value = false;
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
          state.value.transactionsLoaded = [
            ...regularTransactions,
            ...(pendingTransactions || []),
            ...(tipWithdrawnTransactions || []),
          ];
          state.value.nextPagePaginationParams = paginationParams;
          state.value.isEndReached = false;
        }
      }
    }, POLLING_INTERVAL_TRANSACTIONS);
  }

  function stopTransactionListPolling() {
    clearInterval(pollingIntervalId);
  }

  if (
    state.value.accountAddress !== accountAddress
    || state.value.assetContractId !== assetContractId
    || state.value.networkName !== activeNetwork.value.name
  ) {
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
