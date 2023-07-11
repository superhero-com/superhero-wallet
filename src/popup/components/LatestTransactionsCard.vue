<template>
  <div
    v-if="showWidget"
    ref="latestTransactionCard"
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
          v-for="transaction in latestTransactions"
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
import { useStore } from 'vuex';
import { useRoute } from 'vue-router';
import { useConnection, useLatestTransactionList, useViewport } from '../../composables';
import TransactionListItem from './TransactionListItem.vue';
import AnimatedSpinner from '../../icons/animated-spinner.svg?skip-optimize';

export default defineComponent({
  name: 'LatestTransactionsCard',
  components: {
    TransactionListItem,
    AnimatedSpinner,
  },
  setup() {
    const store = useStore();
    const route = useRoute();
    const latestTransactionCard = ref<HTMLDivElement | null>(null);
    const { isOnline } = useConnection();
    const { viewportElement } = useViewport();
    const {
      isTransactionListLoading,
      latestTransactions,
    } = useLatestTransactionList({ store });

    const query = computed(() => route.query);

    const isLoading = computed(
      () => isTransactionListLoading.value && !latestTransactions.value.length,
    );

    const showWidget = computed(() => (
      isOnline.value
      && (isTransactionListLoading.value || latestTransactions.value.length)
    ));

    function conditionalUpdatingState(param?: string) {
      // if we get "latestTxHash" query params, and also all container is mounted,
      // then we can scroll the page to LatestTransactionCard
      if (param && viewportElement.value && latestTransactionCard.value) {
        viewportElement.value.scrollTo({
          top: latestTransactionCard.value.getBoundingClientRect().x + 50,
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
      latestTransactionCard,
      latestTransactions,
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
