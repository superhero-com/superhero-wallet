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
import { IonPage, onIonViewDidEnter, onIonViewDidLeave } from '@ionic/vue';

import {
  useAccounts,
  useTransactionList,
} from '@/composables';

import TransactionList from '@/popup/components/TransactionList.vue';

let initialized = false;

export default defineComponent({
  components: {
    IonPage,
    TransactionList,
  },
  setup() {
    const { activeAccount } = useAccounts();

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

    // Fired only when leaving to different tab within the AccountDetails.
    onIonViewDidLeave(() => {
      isPageActive.value = false;
      stopTransactionListPolling();
      initialized = false;
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
