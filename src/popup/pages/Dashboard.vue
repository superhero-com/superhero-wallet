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

      <Card
        :text="$t('dashboard.buyCard.title')"
        :description="$t('dashboard.buyCard.description')"
        :background="buyBackground"
        :icon="CardIcon"
      >
        <BtnMain
          class="card-button"
          :text="$t('dashboard.buyCard.button')"
          :href="simplexLink"
          variant="secondary"
          inline
        />
      </Card>

      <Card
        :text="$t('dashboard.nameCard.title')"
        :description="$t('dashboard.nameCard.description')"
        :background="chainNameBackground"
        :icon="MenuCardIcon"
      >
        <BtnMain
          class="card-button"
          variant="purple"
          inline
          :text="$t('dashboard.nameCard.button')"
          :to="{ name: 'account-details-names-claim' }"
        />
      </Card>
    </template>
  </DashboardWrapper>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
} from '@vue/composition-api';

import { buildSimplexLink } from '../utils';
import { useGetter } from '../../composables/vuex';

import Card from '../components/Card.vue';
import BtnMain from '../components/buttons/BtnMain.vue';
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
    LatestTransactionsCard,
    OpenTransferReceiveModalButton,
    OpenTransferSendModalButton,
    DashboardHeader,
    DashboardWrapper,
    Card,
    BtnMain,
  },
  setup() {
    const account = useGetter('account');

    const simplexLink = computed(() => buildSimplexLink(account.value.address));

    return {
      ArrowSendIcon,
      ArrowReceiveIcon,
      CardIcon,
      MenuCardIcon,
      simplexLink,
      buyBackground,
      chainNameBackground,
    };
  },
});
</script>

<style lang="scss" scoped>
.dashboard {
  .card-button {
    margin-top: 12px;
  }
}
</style>
