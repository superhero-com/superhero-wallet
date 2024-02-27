<template>
  <IonPage>
    <TransactionList
      v-if="isPageActive"
      :transactions="transactionsLoadedAndPending"
      :is-multisig="isMultisig"
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

import type { AssetContractId } from '@/types';
import { PROTOCOLS } from '@/constants';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';
import {
  useAccounts,
  useAssetDetails,
  useMultisigAccounts,
  useTransactionList,
} from '@/composables';

import TransactionList from '@/popup/components/TransactionList.vue';

let initialized = false;

export default defineComponent({
  name: 'AssetDetailsTransactions',
  components: {
    IonPage,
    TransactionList,
  },
  setup() {
    const route = useRoute();
    const assetContractId = route.params.id as AssetContractId;

    const { sharedAssetDetails } = useAssetDetails();
    const { activeAccount } = useAccounts();
    const { activeMultisigAccount } = useMultisigAccounts();

    const adapter = ProtocolAdapterFactory.getAdapter(activeAccount.value.protocol);

    /** Delay displaying the TransactionList so it can calculate parent element size */
    const isPageActive = ref(false);

    const isMultisig = computed((): boolean => !!sharedAssetDetails.isMultisig);
    const isAssetCoin = computed((): boolean => assetContractId === adapter.coinContractId);

    const currentAddress = computed(
      () => (isMultisig.value)
        ? activeMultisigAccount.value?.gaAccountId!
        : activeAccount.value.address,
    );

    const {
      isEndReached,
      isLoading,
      transactionsLoadedAndPending,
      loadCurrentPageTransactions,
      initializeTransactionListPolling,
      stopTransactionListPolling,
    } = useTransactionList({
      accountAddress: currentAddress.value,
      assetContractId,
      protocol: (isMultisig.value) ? PROTOCOLS.aeternity : activeAccount.value.protocol,
    });

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
      sharedAssetDetails,
      currentAddress,
      transactionsLoadedAndPending,
      isAssetCoin,
      isEndReached,
      isLoading,
      isPageActive,
      isMultisig,
      loadCurrentPageTransactions,
    };
  },
});
</script>
