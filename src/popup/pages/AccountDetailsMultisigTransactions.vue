<template>
  <IonPage>
    <TransactionList
      v-if="isPageActive"
      is-multisig
      :transactions="transactionList"
      :is-loading="isLoading"
      :is-end-reached="isEndReached"
      @load-more="loadCurrentPageTransactions()"
    />
  </IonPage>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  onUnmounted,
  ref,
} from 'vue';
import { useRoute } from 'vue-router';
import { IonPage, onIonViewDidEnter, onIonViewDidLeave } from '@ionic/vue';

import type { ICommonTransaction } from '@/types';
import { PROTOCOLS } from '@/constants';
import { useMultisigAccounts, usePendingMultisigTransaction, useTransactionList } from '@/composables';
import {
  ROUTE_MULTISIG_DETAILS,
  ROUTE_MULTISIG_DETAILS_ASSETS,
  ROUTE_MULTISIG_COIN,
  ROUTE_MULTISIG_COIN_DETAILS,
  ROUTE_MULTISIG_DETAILS_INFO,
} from '@/popup/router/routeNames';

import TransactionList from '../components/TransactionList.vue';

const ROUTE_GROUPS = [
  [
    ROUTE_MULTISIG_DETAILS,
    ROUTE_MULTISIG_DETAILS_ASSETS,
    ROUTE_MULTISIG_DETAILS_INFO,
  ],
  [
    ROUTE_MULTISIG_COIN,
    ROUTE_MULTISIG_COIN_DETAILS,
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
    const { activeMultisigAccount } = useMultisigAccounts();
    const { pendingMultisigTransaction } = usePendingMultisigTransaction();
    let initialized = false;

    const {
      transactionsLoaded,
      isLoading,
      isEndReached,
      initializeTransactionListPolling,
      loadCurrentPageTransactions,
      stopTransactionListPolling,
    } = useTransactionList({
      accountAddress: activeMultisigAccount.value?.gaAccountId!,
      protocol: PROTOCOLS.aeternity,
    });

    /** Delay displaying the TransactionList so it can calculate parent element size */
    const isPageActive = ref(false);

    const transactionList = computed((): ICommonTransaction[] => [
      ...(pendingMultisigTransaction.value) ? [pendingMultisigTransaction.value] : [],
      ...transactionsLoaded.value,
    ]);

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
      transactionList,
      loadCurrentPageTransactions,
    };
  },
});
</script>
