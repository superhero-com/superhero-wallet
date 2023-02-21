<template>
  <DashboardWrapper>
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

    <template #widgets>
      <PendingMultisigTransactionCard />
    </template>
  </DashboardWrapper>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';

import { MODAL_TRANSFER_SEND } from '../utils';
import { useGetter } from '../../composables/vuex';

import PendingMultisigTransactionCard from '../components/PendingMultisigTransactionCard.vue';
import DashboardWrapper from '../components/DashboardWrapper.vue';
import DashboardHeaderMultisig from '../components/DashboardHeaderMultisig.vue';
import OpenTransferReceiveModalButton from '../components/OpenTransferReceiveModalButton.vue';
import OpenTransferProposeModalButton from '../components/OpenTransferProposeModalButton.vue';

import ArrowSendIcon from '../../icons/arrow-send.svg?vue-component';

export default defineComponent({
  name: 'DashboardMultisig',
  components: {
    OpenTransferProposeModalButton,
    OpenTransferReceiveModalButton,
    DashboardHeaderMultisig,
    DashboardWrapper,
    PendingMultisigTransactionCard,
  },
  setup(props, { root }) {
    const isConnected = useGetter('isConnected');

    function openTransferSendModal() {
      root.$store.dispatch('modals/open', {
        name: MODAL_TRANSFER_SEND,
        isMultisig: true,
      });
    }

    return {
      ArrowSendIcon,
      isConnected,
      openTransferSendModal,
    };
  },
});
</script>
