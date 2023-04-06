<template>
  <div class="transaction-list">
    <InfiniteScroll
      class="list"
      data-cy="list"
      is-more-data
      @loadMore="loadMore"
    >
      <TransactionItem
        v-for="transaction in filteredTransactions"
        :key="transaction.hash"
        :transaction="!transaction.isMultisigTransaction ? transaction : null"
        :multisig-transaction="transaction.isMultisigTransaction ? transaction : null"
        :is-multisig="isMultisig"
        :data-cy="transaction.pending && 'pending-txs'"
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
    <RouterLink
      v-if="maxLength && transactions.loaded.length > maxLength"
      to="/transactions"
      class="view-more"
    >
      <Visible class="icon" />
      <span class="text">
        {{ $t('pages.recentTransactions.viewMore') }}
      </span>
    </RouterLink>
  </div>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  getCurrentInstance,
  onMounted,
  onUnmounted,
  ref,
  watch,
} from 'vue';
import { useStore } from 'vuex';
import type {
  INetwork,
  ITokenList,
  ITx,
} from '../../types';
import {
  TXS_PER_PAGE,
  AETERNITY_CONTRACT_ID,
  MOBILE_WIDTH,
  TX_DIRECTION,
  defaultTransactionSortingCallback,
  getInnerTransaction,
} from '../utils';
import { useGetter, useState } from '../../composables/vuex';
import {
  useAccounts,
  useMultisigAccounts,
  usePendingMultisigTransaction,
  useTransactionAndTokenFilter,
  useTransactionTx,
} from '../../composables';

import TransactionItem from './TransactionItem.vue';
import AnimatedSpinner from '../../icons/animated-spinner.svg?skip-optimize';
import Visible from '../../icons/visible.svg?vue-component';
import InfiniteScroll from './InfiniteScroll.vue';

export default defineComponent({
  components: {
    InfiniteScroll,
    TransactionItem,
    AnimatedSpinner,
    Visible,
  },
  props: {
    token: { type: String, default: '' },
    maxLength: { type: Number, default: null },
    scrollTopThreshold: { type: Number, default: undefined },
    showFilters: Boolean,
    showSearch: Boolean,
    isMultisig: Boolean,
  },
  setup(props) {
    const instance = getCurrentInstance();
    const root = instance?.root as any;
    const store = useStore();

    const loading = ref(false);
    const isDestroyed = ref(false);

    const { activeAccount } = useAccounts({ store });
    const { activeMultisigAccount } = useMultisigAccounts({ store });
    const { pendingMultisigTransaction } = usePendingMultisigTransaction({ store });

    const {
      searchPhrase,
      displayMode,
      FILTER_MODE,
    } = useTransactionAndTokenFilter();

    const availableTokens = useState<ITokenList>('fungibleTokens', 'availableTokens');
    const transactions = useState('transactions');
    const activeNetwork = useGetter<INetwork>('activeNetwork');
    const getAccountPendingTransactions = useGetter('getAccountPendingTransactions');
    const getTxSymbol = useGetter('getTxSymbol');

    function isFungibleTokenTx(tx: ITx) {
      return Object.keys(availableTokens.value).includes(tx.contractId);
    }

    const currentAddress = computed(() => props.isMultisig
      ? activeMultisigAccount.value?.gaAccountId
      : activeAccount.value.address);

    const filteredTransactions = computed(
      () => {
        const transactionListLocal = [
          ...getAccountPendingTransactions.value,
          ...transactions.value.loaded,
        ];

        if (props.isMultisig && pendingMultisigTransaction.value?.tx) {
          transactionListLocal.push(pendingMultisigTransaction.value);
        }

        return transactionListLocal
          .filter((tr) => {
            const innerTx = getInnerTransaction(tr.tx);
            return !props.token
              || (
                props.token !== AETERNITY_CONTRACT_ID
                  ? innerTx?.contractId === props.token
                  : (!innerTx.contractId || !isFungibleTokenTx(innerTx))
              );
          })
          .filter((tr) => {
            const { direction, isDex } = useTransactionTx({
              store,
              tx: tr.tx,
              externalAddress: tr.transactionOwner,
            });
            switch (displayMode.value.key) {
              case FILTER_MODE.all:
                return true;
              case FILTER_MODE.dex:
                return isDex.value;
              case FILTER_MODE.out:
                return direction.value === TX_DIRECTION.sent && !isDex.value;
              case FILTER_MODE.in:
                return direction.value === TX_DIRECTION.received;
              default:
                throw new Error(`${root.$t('pages.recentTransactions.unknownMode')} ${displayMode.value.key}`);
            }
          })
          .filter(
            (tr) => !searchPhrase.value || getTxSymbol.value(tr)
              .toLocaleLowerCase()
              .includes(searchPhrase.value.toLocaleLowerCase()),
          )
          .sort(defaultTransactionSortingCallback)
          .slice(0, props.maxLength || Infinity);
      },
    );

    const showSearchAndFilters = computed(() => (
      props.showFilters
      || displayMode.value.key !== FILTER_MODE.all
      || searchPhrase.value
    ));

    function checkLoadMore() {
      if (isDestroyed.value || !transactions.value.nextPageUrl) return;
      // TODO - use viewport.ts composable after rewriting component to Vue 3
      const isDesktop = document.documentElement.clientWidth > MOBILE_WIDTH
          || process.env.IS_EXTENSION;
      const { scrollHeight, scrollTop, clientHeight } = (isDesktop
        ? document.querySelector('.app-inner') : document.documentElement)!;
      if (props.maxLength && filteredTransactions.value.length >= props.maxLength) return;
      if (scrollHeight - scrollTop <= clientHeight + 100) {
        // eslint-disable-next-line no-use-before-define
        loadMore();
      }
    }

    async function loadMore() {
      if (loading.value) return;
      loading.value = true;
      try {
        await store.dispatch('fetchTransactions', { limit: TXS_PER_PAGE, address: currentAddress.value });
      } finally {
        loading.value = false;
      }
      checkLoadMore();
    }

    async function getLatest() {
      try {
        await store.dispatch('fetchTransactions', { limit: 10, recent: true, address: currentAddress.value });
      } finally {
        loading.value = false;
      }
    }

    watch(displayMode, () => {
      checkLoadMore();
    });

    let polling: NodeJS.Timer | null = null;

    onMounted(() => {
      loadMore();
      polling = setInterval(() => getLatest(), 10000);
    });

    onUnmounted(() => {
      if (polling) {
        clearInterval(polling);
      }
      isDestroyed.value = true;
    });

    return {
      loading,
      isDestroyed,
      displayMode,
      availableTokens,
      transactions,
      activeNetwork,
      getAccountPendingTransactions,
      getTxSymbol,
      filteredTransactions,
      showSearchAndFilters,
      loadMore,
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
    padding-bottom: 48px;
  }

  .message > p {
    padding: 48px 64px 0;

    @extend %face-sans-15-medium;

    color: variables.$color-grey-light;
    text-align: center;
  }

  .spinner {
    width: 56px;
    min-height: 56px;
    margin: 0 auto;
    color: variables.$color-white;
  }

  .view-more {
    padding: 12px 16px;
    border-radius: 4px;
    background: variables.$color-bg-1;
    display: flex;
    align-items: center;

    .text {
      @extend %face-sans-14-medium;

      color: variables.$color-success;
      padding-left: 4px;
    }

    .icon {
      width: 24px;
      height: 24px;
      opacity: 0.7;
    }

    &:hover {
      background: variables.$color-bg-2;

      .text {
        color: variables.$color-success-hover;
      }

      .icon {
        opacity: 1;

        path {
          fill: variables.$color-success;
        }
      }
    }

    &:active {
      background: variables.$color-bg-1;

      .text {
        opacity: 0.7;
      }

      .icon {
        opacity: 0.44;
      }
    }
  }
}
</style>
