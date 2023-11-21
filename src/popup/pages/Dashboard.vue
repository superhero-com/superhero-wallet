<template>
  <IonPage>
    <IonContent class="ion-padding ion-content-bg">
      <DashboardWrapper class="dashboard">
        <template #header>
          <DashboardHeader />
        </template>

        <template #buttons>
          <OpenTransferReceiveModalButton is-big />
          <OpenTransferSendModalButton is-big />
        </template>

        <template #cards>
          <LatestTransactionsCard />

          <DashboardCard
            v-if="IS_MOBILE_APP || UNFINISHED_FEATURES"
            :title="$t('dashboard.daeppBrowserCard.title')"
            :description="$t('dashboard.daeppBrowserCard.description')"
            :btn-text="$t('dashboard.daeppBrowserCard.button')"
            :background="daeppBrowserBackground"
            :icon="GlobeIcon"
            :to="{ name: ROUTE_APPS_BROWSER }"
            :card-id="DASHBOARD_CARD_ID.daeppBrowser"
          />
          <DashboardCard
            v-if="isNodeMainnet && UNFINISHED_FEATURES"
            :title="$t('dashboard.buyCard.title')"
            :description="$t('dashboard.buyCard.description')"
            :btn-text="$t('dashboard.buyCard.button')"
            :background="buyBackground"
            :icon="CardIcon"
            :href="activeAccountSimplexLink"
            :card-id="DASHBOARD_CARD_ID.buyAe"
          />

          <DashboardCard
            v-if="
              (isNodeMainnet || isNodeTestnet)
                && activeAccount.protocol === PROTOCOLS.aeternity"
            :title="$t('dashboard.nameCard.title')"
            :description="$t('dashboard.nameCard.description')"
            :btn-text="$t('dashboard.nameCard.button')"
            :background="chainNameBackground"
            :icon="MenuCardIcon"
            :to="{ name: ROUTE_ACCOUNT_DETAILS_NAMES_CLAIM }"
            :card-id="DASHBOARD_CARD_ID.claimName"
            variant="purple"
          />
        </template>
      </DashboardWrapper>
    </IonContent>
  </IonPage>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  watch,
} from 'vue';
import { IonPage, IonContent } from '@ionic/vue';
import { useRoute } from 'vue-router';

import {
  DASHBOARD_CARD_ID,
  IS_MOBILE_APP,
  PROTOCOLS,
  UNFINISHED_FEATURES,
} from '@/constants';
import { ROUTE_ACCOUNT_DETAILS_NAMES_CLAIM, ROUTE_APPS_BROWSER } from '@/popup/router/routeNames';
import {
  useAccounts,
  useAeSdk,
  useDeepLinkApi,
} from '@/composables';
import { buildSimplexLink } from '@/protocols/aeternity/helpers';

import DashboardCard from '@/popup/components/DashboardCard.vue';
import DashboardWrapper from '@/popup/components/DashboardWrapper.vue';
import DashboardHeader from '@/popup/components/DashboardHeader.vue';
import OpenTransferReceiveModalButton from '@/popup/components/OpenTransferReceiveModalButton.vue';
import OpenTransferSendModalButton from '@/popup/components/OpenTransferSendModalButton.vue';
import LatestTransactionsCard from '@/popup/components/LatestTransactionsCard.vue';

import ArrowReceiveIcon from '@/icons/arrow-receive.svg?vue-component';
import ArrowSendIcon from '@/icons/arrow-send.svg?vue-component';
import CardIcon from '@/icons/credit-card.svg?vue-component';
import MenuCardIcon from '@/icons/menu-card-fill.svg?vue-component';
import buyBackground from '@/image/dashboard/buy-ae.jpg';
import chainNameBackground from '@/image/dashboard/chain-name.jpg';
import daeppBrowserBackground from '@/image/dashboard/aepp-browser.jpg';
import GlobeIcon from '@/icons/globe-small.svg?vue-component';

export default defineComponent({
  name: 'Dashboard',
  components: {
    DashboardCard,
    LatestTransactionsCard,
    OpenTransferReceiveModalButton,
    OpenTransferSendModalButton,
    DashboardHeader,
    DashboardWrapper,
    IonPage,
    IonContent,
  },
  setup() {
    const route = useRoute();

    const { activeAccount } = useAccounts();
    const { checkIfOpenTransferSendModal } = useDeepLinkApi();
    const { isNodeMainnet, isNodeTestnet } = useAeSdk();

    const activeAccountSimplexLink = computed(() => buildSimplexLink(activeAccount.value.address));

    watch(
      () => route.query,
      () => checkIfOpenTransferSendModal(route),
      {
        deep: true,
        immediate: true,
      },
    );

    return {
      PROTOCOLS,
      DASHBOARD_CARD_ID,
      UNFINISHED_FEATURES,
      ROUTE_ACCOUNT_DETAILS_NAMES_CLAIM,
      ROUTE_APPS_BROWSER,
      IS_MOBILE_APP,
      ArrowSendIcon,
      ArrowReceiveIcon,
      CardIcon,
      MenuCardIcon,
      GlobeIcon,
      activeAccount,
      activeAccountSimplexLink,
      buyBackground,
      chainNameBackground,
      daeppBrowserBackground,
      isNodeMainnet,
      isNodeTestnet,
    };
  },
});
</script>
