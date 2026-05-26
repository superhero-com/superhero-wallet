<template>
  <IonPage>
    <TransactionList
      v-if="isPageActive"
      :transactions="transactionsLoadedAndPending"
      :is-loading="isLoading"
      :is-end-reached="isEndReached"
      @load-more="loadCurrentPageTransactions()"
    />
  </IonPage>
</template>

<script lang="ts">
import {
  defineComponent,
  onUnmounted,
  ref,
} from 'vue';
import { useRoute } from 'vue-router';
import { IonPage, onIonViewDidEnter, onIonViewDidLeave } from '@ionic/vue';

import {
  useAccounts,
  useTransactionList,
} from '@/composables';
import {
  ROUTE_ACCOUNT_DETAILS,
  ROUTE_ACCOUNT_DETAILS_ASSETS,
  ROUTE_ACCOUNT_DETAILS_NAMES,
  ROUTE_ACCOUNT_DETAILS_NAMES_AUCTIONS,
  ROUTE_ACCOUNT_DETAILS_NAMES_CLAIM,
} from '@/popup/router/routeNames';

import TransactionList from '@/popup/components/TransactionList.vue';

const ROUTE_GROUPS = [
  [
    ROUTE_ACCOUNT_DETAILS,
    ROUTE_ACCOUNT_DETAILS_ASSETS,
    ROUTE_ACCOUNT_DETAILS_NAMES,
    ROUTE_ACCOUNT_DETAILS_NAMES_AUCTIONS,
    ROUTE_ACCOUNT_DETAILS_NAMES_CLAIM,
  ],
];

export default defineComponent({
  components: {
    IonPage,
    TransactionList,
  },
  setup() {
    const route = useRoute();
    const currentRouteGroup = ROUTE_GROUPS.find((routeGroup) => (
      routeGroup.includes(route.name as string)
    )) || [];
    const { activeAccount } = useAccounts();
    let initialized = false;

    const {
      transactionsLoadedAndPending,
      isEndReached,
      isLoading,
      loadCurrentPageTransactions,
      initializeTransactionListPolling,
      stopTransactionListPolling,
    } = useTransactionList({
      accountAddress: activeAccount.value.address,
      protocol: activeAccount.value.protocol,
    });

    /** Delay displaying the TransactionList so it can calculate parent element size */
    const isPageActive = ref(false);

    // Fired when accessing the page both as tab and whole AccountDetails page.
    onIonViewDidEnter(() => {
      isPageActive.value = true;
      // IonRouterOutlet re-renders the page twice
      // https://github.com/ionic-team/ionic-framework/issues/25254
      if (!initialized) {
        initializeTransactionListPolling();
        initialized = true;
      }
    });

    // Fired when leaving to a different tab within AccountDetails.
    // During iOS swipe-back the page is still visible while leaving, so keep the list mounted
    // to avoid an empty redraw/flicker; onUnmounted handles cleanup when leaving AccountDetails.
    onIonViewDidLeave(() => {
      if (currentRouteGroup.includes(route.name as string)) {
        isPageActive.value = false;
        stopTransactionListPolling();
        initialized = false;
      }
    });

    // Fired when leaving the AccountDetails page.
    onUnmounted(() => {
      isPageActive.value = false;
      stopTransactionListPolling();
      initialized = false;
    });

    return {
      isPageActive,
      isLoading,
      isEndReached,
      transactionsLoadedAndPending,
      loadCurrentPageTransactions,
    };
  },
});
</script>
