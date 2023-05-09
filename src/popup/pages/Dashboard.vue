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
        v-if="!IS_IOS"
        :title="$t('dashboard.buyCard.title')"
        :description="$t('dashboard.buyCard.description')"
        :btn-text="$t('dashboard.buyCard.button')"
        :background="buyBackground"
        :icon="CardIcon"
        :href="activeAccountSimplexLink"
        :card-id="DASHBOARD_CARD_ID.buyAe"
      />

      <DashboardCard
        :title="$t('dashboard.nameCard.title')"
        :description="$t('dashboard.nameCard.description')"
        :btn-text="$t('dashboard.nameCard.button')"
        :background="chainNameBackground"
        :icon="MenuCardIcon"
        :to="{ name: 'account-details-names-claim' }"
        :card-id="DASHBOARD_CARD_ID.claimName"
        variant="purple"
      />
    </template>
  </DashboardWrapper>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';

import { DASHBOARD_CARD_ID } from '../utils';
import { useAccounts } from '../../composables';
import { IS_IOS } from '../../lib/environment';

import DashboardCard from '../components/DashboardCard.vue';
import DashboardWrapper from '../components/DashboardWrapper.vue';
import DashboardHeader from '../components/DashboardHeader.vue';
import OpenTransferReceiveModalButton from '../components/OpenTransferReceiveModalButton.vue';
import OpenTransferSendModalButton from '../components/OpenTransferSendModalButton.vue';
import LatestTransactionsCard from '../components/LatestTransactionsCard.vue';

import ArrowReceiveIcon from '../../icons/arrow-receive.svg?vue-component';
import ArrowSendIcon from '../../icons/arrow-send.svg?vue-component';
import CardIcon from '../../icons/credit-card.svg?vue-component';
import MenuCardIcon from '../../icons/menucard.fill.svg?vue-component';

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
  setup(props, { root }) {
    const { activeAccountSimplexLink } = useAccounts({ store: root.$store });

    return {
      DASHBOARD_CARD_ID,
      ArrowSendIcon,
      ArrowReceiveIcon,
      CardIcon,
      MenuCardIcon,
      activeAccountSimplexLink,
      buyBackground,
      chainNameBackground,
      IS_IOS,
    };
  },
});
</script>
