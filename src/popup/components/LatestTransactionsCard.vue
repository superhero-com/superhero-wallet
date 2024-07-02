<template>
  <Panel
    v-if="showWidget"
    ref="latestTransactionCardEl"
    class="latest-transaction-card"
    :header="$t('dashboard.latestTransactionCard.title')"
  >
    <template
      v-if="UNFINISHED_FEATURES"
      #header-after
    >
      <BtnIcon
        class="btn-refresh"
        size="sm"
        :icon="RefreshIcon"
        :loading="areLatestTransactionsUpdating"
        @click="loadAllLatestTransactions()"
      />
    </template>

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
          hide-fee-from-assets
        />
      </div>
    </Transition>
  </Panel>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  onMounted,
  ref,
  watch,
} from 'vue';
import { useRoute } from 'vue-router';
import type { ComponentRef } from '@/types';
import {
  useConnection,
  useLatestTransactionList,
  useViewport,
} from '@/composables';
import { UNFINISHED_FEATURES } from '@/constants';

import AnimatedSpinner from '@/icons/animated-spinner.svg?vue-component';
import RefreshIcon from '@/icons/dapp/dapp-refresh.svg?vue-component';

import Panel from './Panel.vue';
import TransactionListItem from './TransactionListItem.vue';
import BtnIcon from './buttons/BtnIcon.vue';

const DASHBOARD_TRANSACTION_LIMIT = 3;

export default defineComponent({
  name: 'LatestTransactionsCard',
  components: {
    Panel,
    TransactionListItem,
    AnimatedSpinner,
    BtnIcon,
  },
  setup() {
    const route = useRoute();
    const latestTransactionCardEl = ref<ComponentRef | null>(null);

    const { isOnline } = useConnection();
    const { viewportElement } = useViewport();
    const {
      allLatestTransactions,
      areLatestTransactionsUpdating,
      accountsTransactionsPending,
      loadAllLatestTransactions,
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

    /**
     * Scroll the page to this component instance if the page was opened
     * with "latestTxHash" query param and all required elements are mounted.
     * TODO: Functionality broken due to unaccessible viewportElement
     */
    function conditionalUpdatingState(param?: string) {
      if (param && viewportElement.value && latestTransactionCardEl.value?.$el) {
        viewportElement.value!.scrollTo({
          top: latestTransactionCardEl.value!.$el.getBoundingClientRect().x + 50,
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
      RefreshIcon,
      allLatestTransactions,
      accountsTransactionsPending,
      areLatestTransactionsUpdating,
      latestTransactionCardEl,
      latestTransactionsToDisplay,
      showWidget,
      isLoading,
      loadAllLatestTransactions,
      UNFINISHED_FEATURES,
    };
  },
});
</script>

<style lang="scss" scoped>
.latest-transaction-card {
  .spinner {
    display: block;
    margin-inline: auto;
    height: 60px;
  }

  .btn-refresh {
    margin-block: -2px;
    margin-right: -6px;
  }

  .transaction-item {
    padding-block: 10px;
  }
}
</style>
