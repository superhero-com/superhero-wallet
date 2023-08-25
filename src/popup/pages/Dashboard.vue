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
        v-if="isNodeMainnet && !IS_IOS"
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
  IS_IOS,
  PROTOCOL_AETERNITY,
} from '@/constants';
import { ROUTE_ACCOUNT_DETAILS_NAMES_CLAIM } from '@/popup/router/routeNames';
import { useAccounts, useAeSdk } from '@/composables';

import DashboardCard from '../components/DashboardCard.vue';
import DashboardWrapper from '../components/DashboardWrapper.vue';
import DashboardHeader from '../components/DashboardHeader.vue';
import OpenTransferReceiveModalButton from '../components/OpenTransferReceiveModalButton.vue';
import OpenTransferSendModalButton from '../components/OpenTransferSendModalButton.vue';
import LatestTransactionsCard from '../components/LatestTransactionsCard.vue';

import ArrowReceiveIcon from '../../icons/arrow-receive.svg?vue-component';
import ArrowSendIcon from '../../icons/arrow-send.svg?vue-component';
import CardIcon from '../../icons/credit-card.svg?vue-component';
import MenuCardIcon from '../../icons/menu-card-fill.svg?vue-component';

import buyBackground from '../../image/dashboard/buy-ae.jpg';
import chainNameBackground from '../../image/dashboard/chain-name.jpg';

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
      activeAccountFaucetUrl,
    } = useAccounts({ store });

    const { isNodeMainnet, isNodeTestnet } = useAeSdk({ store });

    return {
      PROTOCOL_AETERNITY,
      DASHBOARD_CARD_ID,
      IS_IOS,
      ROUTE_ACCOUNT_DETAILS_NAMES_CLAIM,
      ArrowSendIcon,
      ArrowReceiveIcon,
      CardIcon,
      MenuCardIcon,
      activeAccount,
      activeAccountSimplexLink,
      activeAccountFaucetUrl,
      buyBackground,
      chainNameBackground,
      isNodeMainnet,
      isNodeTestnet,
    };
  },
});
</script>
