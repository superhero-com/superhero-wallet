<template>
  <div
    v-if="showWidget"
    ref="latestTransactionCardEl"
    class="latest-transaction-card"
  >
    <div class="title">
      {{ $t('dashboard.latestTransactionCard.title') }}
    </div>

    <Transition name="page-transition">
      <AnimatedSpinner
        v-if="isLoading"
        class="spinner"
      />
      <div v-else>
        <TransactionListItem
          v-for="transaction in latestTransactionsToDisplay"
          :key="`${transaction.transactionOwner}-${transaction.hash}`"
          class="transaction-item"
          :transaction="transaction"
          show-transaction-owner
        />
      </div>
    </Transition>
  </div>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  onMounted,
  watch,
  ref,
} from 'vue';
import { useRoute } from 'vue-router';
import {
  useConnection,
  useLatestTransactionList,
  useViewport,
} from '@/composables';

import TransactionListItem from './TransactionListItem.vue';
import AnimatedSpinner from '../../icons/animated-spinner.svg?skip-optimize';

const DASHBOARD_TRANSACTION_LIMIT = 3;

export default defineComponent({
  name: 'LatestTransactionsCard',
  components: {
    TransactionListItem,
    AnimatedSpinner,
  },
  setup() {
    const route = useRoute();
    const latestTransactionCardEl = ref<HTMLDivElement | null>(null);
    const { isOnline } = useConnection();
    const { viewportElement } = useViewport();
    const {
      allLatestTransactions,
      areLatestTransactionsUpdating,
    } = useLatestTransactionList();

    const query = computed(() => route.query);

    const isLoading = computed(
      () => areLatestTransactionsUpdating.value && !allLatestTransactions.value.length,
    );

    const showWidget = computed(() => (
      isOnline.value
      && (areLatestTransactionsUpdating.value || allLatestTransactions.value.length)
    ));

    const latestTransactionsToDisplay = computed(
      () => allLatestTransactions.value.slice(0, DASHBOARD_TRANSACTION_LIMIT),
    );

    function conditionalUpdatingState(param?: string) {
      // if we get "latestTxHash" query params, and also all container is mounted,
      // then we can scroll the page to LatestTransactionCard
      if (param && viewportElement.value && latestTransactionCardEl.value) {
        viewportElement.value.scrollTo({
          top: latestTransactionCardEl.value.getBoundingClientRect().x + 50,
        });
      }
    }

    watch(query, (val) => {
      conditionalUpdatingState(val.latestTxHash as string);
    });

    onMounted(() => {
      conditionalUpdatingState(query.value.latestTxHash as string);
    });

    return {
      allLatestTransactions,
      latestTransactionCardEl,
      latestTransactionsToDisplay,
      showWidget,
      isLoading,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../styles/variables';
@use '../../styles/typography';
@use '../../styles/mixins';

.latest-transaction-card {
  width: 100%;
  background-color: variables.$color-bg-6;
  border-radius: variables.$border-radius-interactive;
  padding-block: 8px;
  display: flex;
  flex-direction: column;

  .title {
    @extend %face-sans-16-semi-bold;

    color: variables.$color-white;
    line-height: 24px;
    padding-inline: 12px;
    margin-bottom: 4px;
  }

  .offline-message {
    margin: auto;
    padding-block: 10px;
  }

  .spinner {
    align-self: center;
    height: 60px;
  }

  .transaction-item {
    padding-block: 10px;
  }
}
</style>
