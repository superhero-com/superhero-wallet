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
        :transaction="getCommonTransaction(transaction)"
        :multisig-transaction="getMultisigTransaction(transaction)"
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
      {{ $t('pages.recentTransactions.noTransactionsFound') }}
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
} from '@vue/composition-api';
import { TXS_PER_PAGE } from '../utils';
import { useDispatch } from '../../composables/vuex';
import {
  useMultisigAccounts,
  useTransactionAndTokenFilter,
  useViewport,
  useTransactionList,
  useAccounts,
} from '../../composables';
import TransactionItem from './TransactionItem.vue';
import AnimatedSpinner from '../../icons/animated-spinner.svg?skip-optimize';
import InfiniteScroll from './InfiniteScroll.vue';

export default defineComponent({
  components: {
    InfiniteScroll,
    TransactionItem,
    AnimatedSpinner,
  },
  props: {
    token: { type: String, default: '' },
    isMultisig: Boolean,
  },
  setup(props, { root }) {
    const loading = ref(false);
    const isDestroyed = ref(false);
    const fetchTransactions = useDispatch('fetchTransactions');

    const {
      activeAccount,
    } = useAccounts({ store: root.$store });

    const {
      activeMultisigAccount,
    } = useMultisigAccounts({ store: root.$store });

    const {
      displayMode,
    } = useTransactionAndTokenFilter();

    const {
      viewportElement,
    } = useViewport();

    const {
      filteredTransactions,
      canLoadMore,
      getMultisigTransaction,
      getCommonTransaction,
    } = useTransactionList({
      store: root.$store,
      token: props.token,
    });

    const currentAddress = computed(() => props.isMultisig
      ? activeMultisigAccount.value?.gaAccountId
      : activeAccount.value.address);

    async function fetchTransactionData(recent?: boolean) {
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
      if (loading.value) {
        return;
      }
      await fetchTransactionData();
      // eslint-disable-next-line no-use-before-define
      await checkLoadMore();
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

    let polling: NodeJS.Timer | null = null;

    onMounted(async () => {
      await loadMore();
      polling = setInterval(() => fetchTransactionData(true), 10000);
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
      getCommonTransaction,
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
