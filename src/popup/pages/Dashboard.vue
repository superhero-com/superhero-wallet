<template>
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
        v-if="IS_CORDOVA || UNFINISHED_FEATURES"
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
        v-if="(isNodeMainnet || isNodeTestnet) && activeAccount.protocol === PROTOCOL_AETERNITY"
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
</template>

<script lang="ts">
import { defineComponent } from 'vue';

import { useStore } from 'vuex';
import {
  DASHBOARD_CARD_ID,
  IS_CORDOVA,
  PROTOCOL_AETERNITY,
  UNFINISHED_FEATURES,
} from '@/constants';
import { ROUTE_ACCOUNT_DETAILS_NAMES_CLAIM, ROUTE_APPS_BROWSER } from '@/popup/router/routeNames';
import { useAccounts, useAeSdk } from '@/composables';

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
  },
  setup() {
    const store = useStore();

    const {
      activeAccount,
      activeAccountSimplexLink,
    } = useAccounts({ store });

    const { isNodeMainnet, isNodeTestnet } = useAeSdk({ store });

    return {
      PROTOCOL_AETERNITY,
      DASHBOARD_CARD_ID,
      UNFINISHED_FEATURES,
      ROUTE_ACCOUNT_DETAILS_NAMES_CLAIM,
      ROUTE_APPS_BROWSER,
      ArrowSendIcon,
      ArrowReceiveIcon,
      CardIcon,
      MenuCardIcon,
      activeAccount,
      GlobeIcon,
      activeAccountSimplexLink,
      buyBackground,
      chainNameBackground,
      daeppBrowserBackground,
      IS_CORDOVA,
      isNodeMainnet,
      isNodeTestnet,
    };
  },
});
</script>
