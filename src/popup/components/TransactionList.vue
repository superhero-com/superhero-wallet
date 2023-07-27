<template>
  <div class="transaction-list">
    <InfiniteScroll
      class="list"
      data-cy="list"
      is-more-data
      @loadMore="loadMore"
    >
      <TransactionListItem
        v-for="transaction in filteredTransactions"
        :key="transaction.hash"
        :transaction="getTransaction(transaction)"
        :multisig-transaction="getMultisigTransaction(transaction)"
        :is-multisig="isMultisig"
      />
    </InfiniteScroll>
    <AnimatedSpinner
      v-if="loading"
      class="spinner"
      data-cy="loader"
    />
    <div
      v-else-if="!filteredTransactions.length"
      class="message"
    >
      <p>
        {{ $t('pages.recentTransactions.noTransactionsFound') }}
      </p>
    </div>
  </div>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  onMounted,
  onUnmounted,
  ref,
  watch,
} from 'vue';
import { useStore } from 'vuex';
import { useI18n } from 'vue-i18n';
import { AE_CONTRACT_ID } from '@/protocols/aeternity/config';
import {
  TXS_PER_PAGE,
  TX_DIRECTION,
  TRANSACTION_OWNERSHIP_STATUS,
  getMultisigTransaction,
  getInnerTransaction,
  getOwnershipStatus,
  getTransaction,
  getTxDirection,
  getTxOwnerAddress,
  isTxDex,
  sortTransactionsByDateCallback,
  pipe,
  includesCaseInsensitive,
} from '../utils';
import { useDispatch, useGetter, useState } from '../../composables/vuex';
import {
  useMultisigAccounts,
  useTransactionAndTokenFilter,
  useViewport,
  useAccounts,
  usePendingMultisigTransaction,
  useUi,
  useAeSdk,
} from '../../composables';

import TransactionListItem from './TransactionListItem.vue';
import AnimatedSpinner from '../../icons/animated-spinner.svg?skip-optimize';
import InfiniteScroll from './InfiniteScroll.vue';
import {
  ITokenList,
  ITransaction,
  ICommonTransaction,
  ITransactionsState,
  ITx,
} from '../../types';

export default defineComponent({
  components: {
    InfiniteScroll,
    TransactionListItem,
    AnimatedSpinner,
  },
  props: {
    tokenContractId: { type: String, default: '' },
    isMultisig: Boolean,
  },
  setup(props) {
    const store = useStore();
    const { t } = useI18n();

    const {
      activeAccount,
      accounts,
    } = useAccounts({ store });

    const {
      activeMultisigAccount,
    } = useMultisigAccounts({ store });

    const { isAppActive } = useUi();

    const {
      viewportElement,
    } = useViewport();

    const {
      searchPhrase,
      displayMode,
      FILTER_MODE,
    } = useTransactionAndTokenFilter();

    const { dexContracts } = useAeSdk({ store });

    const { pendingMultisigTransaction } = usePendingMultisigTransaction({ store });

    const loading = ref(false);
    const isDestroyed = ref(false);

    const availableTokens = useState<ITokenList>('fungibleTokens', 'availableTokens');

    const transactions = useState<ITransactionsState>('transactions');
    const getTxSymbol = useGetter('getTxSymbol');
    const getAccountPendingTransactions = useGetter<ITransaction[]>('getAccountPendingTransactions');
    const fetchTransactions = useDispatch('fetchTransactions');

    const canLoadMore = computed(() => !!transactions.value.nextPageUrl);

    const currentAddress = computed(() => props.isMultisig
      ? activeMultisigAccount.value?.gaAccountId
      : activeAccount.value.address);

    const loadedTransactionList = computed((): ICommonTransaction[] => [
      ...getAccountPendingTransactions.value,
      ...transactions.value.loaded,
      ...((props.isMultisig && pendingMultisigTransaction.value?.tx)
        ? [pendingMultisigTransaction.value]
        : []
      ),
    ]);

    function isFungibleTokenTx(tx: ITx) {
      return Object.keys(availableTokens.value).includes(tx.contractId);
    }

    function narrowTransactionsToDefinedToken(transactionList: ICommonTransaction[]) {
      if (props.tokenContractId) {
        return transactionList.filter((transaction) => {
          const innerTx = getInnerTransaction(transaction.tx);

          if (props.tokenContractId !== AE_CONTRACT_ID) {
            return innerTx?.contractId === props.tokenContractId;
          }

          return !innerTx.contractId || !isFungibleTokenTx(innerTx);
        });
      }
      return transactionList;
    }

    function filterTransactionsByDisplayMode(transactionList: ICommonTransaction[]) {
      return transactionList.filter((transaction) => {
        const outerTx = transaction.tx!;
        const innerTx = transaction.tx ? getInnerTransaction(transaction.tx) : null;

        const txOwnerAddress = getTxOwnerAddress(innerTx);

        const direction = getTxDirection(
          outerTx.payerId ? outerTx : innerTx,
          (transaction as ITransaction).transactionOwner
          || ((
            getOwnershipStatus(activeAccount.value, accounts.value, innerTx)
            !== TRANSACTION_OWNERSHIP_STATUS.current
          ) && txOwnerAddress
          )
          || activeAccount.value.address,
        );

        const isDex = isTxDex(innerTx, dexContracts.value);

        switch (displayMode.value.key) {
          case FILTER_MODE.all:
            return true;
          case FILTER_MODE.dex:
            return isDex;
          case FILTER_MODE.out:
            return direction === TX_DIRECTION.sent && !isDex;
          case FILTER_MODE.in:
            return direction === TX_DIRECTION.received;
          default:
            throw new Error(`${t('pages.recentTransactions.unknownMode')} ${displayMode.value.key}`);
        }
      });
    }

    function filterTransactionsBySearchPhrase(transactionList: ICommonTransaction[]) {
      return transactionList.filter(
        (transaction) => (
          !searchPhrase.value
          || includesCaseInsensitive(
            getTxSymbol.value(transaction),
            searchPhrase.value.toLocaleLowerCase(),
          )
        ),
      );
    }

    function sortTransactionListByDate(transactionList: ICommonTransaction[]) {
      return transactionList.sort(sortTransactionsByDateCallback);
    }

    const filteredTransactions = computed(
      () => pipe<ICommonTransaction[]>([
        narrowTransactionsToDefinedToken,
        filterTransactionsByDisplayMode,
        filterTransactionsBySearchPhrase,
        sortTransactionListByDate,
      ])(loadedTransactionList.value),
    );

    async function fetchTransactionList(recent?: boolean) {
      loading.value = true;
      try {
        await fetchTransactions({
          limit: TXS_PER_PAGE,
          recent,
          address: currentAddress.value,
        });
      } finally {
        loading.value = false;
      }
    }

    async function loadMore() {
      if (!loading.value) {
        await fetchTransactionList();
      }
    }

    async function checkLoadMore() {
      if (viewportElement.value && (isDestroyed.value || !canLoadMore.value)) {
        return;
      }

      const {
        scrollHeight,
        scrollTop,
        clientHeight,
      } = viewportElement.value!;

      if (scrollHeight - scrollTop <= clientHeight + 100) {
        await loadMore();
      }
    }

    watch(displayMode, () => {
      checkLoadMore();
    });

    watch(loading, async (val) => {
      if (!val) {
        await checkLoadMore();
      }
    });

    let polling: NodeJS.Timer | null = null;

    onMounted(() => {
      loadMore();
      polling = setInterval(() => {
        if (isAppActive.value) {
          fetchTransactionList(true);
        }
      }, 10000);
    });

    onUnmounted(() => {
      if (polling) {
        clearInterval(polling);
      }
      isDestroyed.value = true;
    });

    return {
      loading,
      filteredTransactions,
      loadMore,
      getMultisigTransaction,
      getTransaction,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../styles/variables';
@use '../../styles/typography';

.transaction-list {
  display: flex;
  flex-direction: column;
  margin: 0 calc(-1 * var(--screen-padding-x));

  .list {
    padding: 0;
    margin: 0;
  }

  .message,
  .spinner {
    flex-grow: 1;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .message {
    @extend %face-sans-15-medium;

    color: variables.$color-grey-light;
    text-align: center;
    padding: 48px 64px 0;
  }

  .spinner {
    width: 56px;
    min-height: 56px;
    margin: 0 auto;
    padding-bottom: 48px;
    color: variables.$color-white;
  }
}
</style>
