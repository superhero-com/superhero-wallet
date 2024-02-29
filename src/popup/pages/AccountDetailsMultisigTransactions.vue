<template>
  <IonPage>
    <TransactionList
      v-if="isPageActive"
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
import { IonPage, onIonViewDidEnter, onIonViewDidLeave } from '@ionic/vue';

import type { ICommonTransaction } from '@/types';
import { PROTOCOLS } from '@/constants';
import { useMultisigAccounts, usePendingMultisigTransaction, useTransactionList } from '@/composables';

import TransactionList from '../components/TransactionList.vue';

let initialized = false;

export default defineComponent({
  components: {
    IonPage,
    TransactionList,
  },
  setup() {
    const { activeMultisigAccount } = useMultisigAccounts();
    const { pendingMultisigTransaction } = usePendingMultisigTransaction();

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
      transactionList,
      loadCurrentPageTransactions,
    };
  },
});
</script>
