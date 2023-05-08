<template>
  <div
    v-if="showWidget"
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
        <TransactionItem
          v-for="transaction in transactionList"
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
import { computed, defineComponent } from '@vue/composition-api';
import { useConnection, useLatestTransactionList } from '../../composables';
import TransactionItem from './TransactionItem.vue';
import AnimatedSpinner from '../../icons/animated-spinner.svg?skip-optimize';

export default defineComponent({
  name: 'LatestTransactionsCard',
  components: {
    TransactionItem,
    AnimatedSpinner,
  },
  setup(props, { root }) {
    const { isOnline } = useConnection();
    const {
      isTransactionListLoading,
      transactionList,
    } = useLatestTransactionList({ store: root.$store });

    const isLoading = computed(
      () => isTransactionListLoading.value && !transactionList.value.length,
    );
    const showWidget = computed(() => (
      isOnline.value
      && (isTransactionListLoading.value || transactionList.value.length)
    ));

    return {
      transactionList,
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
    @extend %face-sans-15-bold;

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
