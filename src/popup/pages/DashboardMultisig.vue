<template>
  <DashboardWrapper class="dashboard-multisig">
    <template #header>
      <DashboardHeaderMultisig />
    </template>

    <template #buttons>
      <OpenTransferReceiveModalButton
        is-multisig
        is-big
      />
      <OpenTransferProposeModalButton is-big />
    </template>

    <template #cards>
      <DashboardCard
        v-if="simplexLink"
        :title="$t('dashboard.buyCard.title')"
        :description="$t('dashboard.buyCard.description')"
        :btn-text="$t('dashboard.buyCard.button')"
        :background="buyBackground"
        :icon="CardIcon"
        :href="simplexLink"
      />
    </template>

    <template #widgets>
      <PendingMultisigTransactionCard />
    </template>
  </DashboardWrapper>
</template>

<script lang="ts">
import { computed, defineComponent } from '@vue/composition-api';

import { buildSimplexLink, MODAL_TRANSFER_SEND } from '../utils';
import { useMultisigAccounts } from '../../composables';
import { useGetter } from '../../composables/vuex';

import PendingMultisigTransactionCard from '../components/PendingMultisigTransactionCard.vue';
import DashboardWrapper from '../components/DashboardWrapper.vue';
import DashboardCard from '../components/DashboardCard.vue';
import DashboardHeaderMultisig from '../components/DashboardHeaderMultisig.vue';
import OpenTransferReceiveModalButton from '../components/OpenTransferReceiveModalButton.vue';
import OpenTransferProposeModalButton from '../components/OpenTransferProposeModalButton.vue';

import ArrowSendIcon from '../../icons/arrow-send.svg?vue-component';
import CardIcon from '../../icons/credit-card.svg?vue-component';

import buyBackground from '../../image/dashboard/buy-ae.jpg';

export default defineComponent({
  name: 'DashboardMultisig',
  components: {
    DashboardCard,
    OpenTransferProposeModalButton,
    OpenTransferReceiveModalButton,
    DashboardHeaderMultisig,
    DashboardWrapper,
    PendingMultisigTransactionCard,
  },
  setup(props, { root }) {
    const { activeMultisigAccount } = useMultisigAccounts({ store: root.$store });

    const isConnected = useGetter('isConnected');

    const simplexLink = computed(
      () => activeMultisigAccount.value
        ? buildSimplexLink(activeMultisigAccount.value.gaAccountId)
        : '',
    );

    function openTransferSendModal() {
      root.$store.dispatch('modals/open', {
        name: MODAL_TRANSFER_SEND,
        isMultisig: true,
      });
    }

    return {
      ArrowSendIcon,
      CardIcon,
      buyBackground,
      isConnected,
      simplexLink,
      openTransferSendModal,
    };
  },
});
</script>

<style lang="scss" scoped>
.dashboard-multisig {
  .card-button {
    margin-top: 12px;
  }
}
</style>
