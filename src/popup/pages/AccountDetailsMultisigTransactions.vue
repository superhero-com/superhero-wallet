<template>
  <IonPage>
    <TransactionList
      v-if="isPageActive"
      :transactions="transactionList"
      :is-loading="isLoading"
      :is-end-reached="isEndReached"
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
    onIonViewDidEnter(async () => {
      isPageActive.value = true;
      initializeTransactionListPolling();
    });

    // Fired only when leaving to different tab within the AccountDetails.
    onIonViewDidLeave(() => {
      isPageActive.value = false;
      stopTransactionListPolling();
    });

    // Fired when leaving the AccountDetails page.
    onUnmounted(() => {
      isPageActive.value = false;
      stopTransactionListPolling();
    });

    return {
      isPageActive,
      isLoading,
      isEndReached,
      transactionList,
    };
  },
});
</script>
