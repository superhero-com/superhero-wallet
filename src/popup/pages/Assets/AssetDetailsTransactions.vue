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
import {
  ROUTE_COIN,
  ROUTE_COIN_DETAILS,
  ROUTE_TOKEN,
  ROUTE_TOKEN_DETAILS,
} from '@/popup/router/routeNames';

import TransactionList from '@/popup/components/TransactionList.vue';

const ROUTE_GROUPS = [
  [
    ROUTE_COIN,
    ROUTE_COIN_DETAILS,
  ],
  [
    ROUTE_TOKEN,
    ROUTE_TOKEN_DETAILS,
  ],
];

export default defineComponent({
  name: 'AssetDetailsTransactions',
  components: {
    IonPage,
    TransactionList,
  },
  setup() {
    const route = useRoute();
    const currentRouteGroup = ROUTE_GROUPS.find((routeGroup) => (
      routeGroup.includes(route.name as string)
    )) || [];
    const assetContractId = route.params.id as AssetContractId;
    let initialized = false;

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

    // Fired when accessing the page both as tab and whole AssetDetails page.
    onIonViewDidEnter(() => {
      isPageActive.value = true;
      // IonRouterOutlet re-renders the page twice
      // https://github.com/ionic-team/ionic-framework/issues/25254
      if (!initialized) {
        initializeTransactionListPolling();
        initialized = true;
      }
    });

    // Fired when leaving to a different tab within AssetDetails.
    // During iOS swipe-back the page is still visible while leaving, so keep the list mounted
    // to avoid an empty redraw/flicker; onUnmounted handles cleanup when leaving AssetDetails.
    onIonViewDidLeave(() => {
      if (currentRouteGroup.includes(route.name as string)) {
        isPageActive.value = false;
        stopTransactionListPolling();
        initialized = false;
      }
    });

    // Fired when leaving the AssetDetails page.
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
