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
      <OpenTransferSendModalButton
        is-multisig
        is-big
      />
    </template>

    <template #widgets>
      <PendingMultisigTransactionCard />
    </template>
  </DashboardWrapper>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

import { MODAL_TRANSFER_SEND } from '../utils';
import { useModals } from '../../composables';

import PendingMultisigTransactionCard from '../components/PendingMultisigTransactionCard.vue';
import DashboardWrapper from '../components/DashboardWrapper.vue';
import DashboardHeaderMultisig from '../components/DashboardHeaderMultisig.vue';
import OpenTransferReceiveModalButton from '../components/OpenTransferReceiveModalButton.vue';
import OpenTransferSendModalButton from '../components/OpenTransferSendModalButton.vue';

import ArrowSendIcon from '../../icons/arrow-send.svg?vue-component';

export default defineComponent({
  name: 'DashboardMultisig',
  components: {
    OpenTransferSendModalButton,
    OpenTransferReceiveModalButton,
    DashboardHeaderMultisig,
    DashboardWrapper,
    PendingMultisigTransactionCard,
  },
  setup() {
    const { openModal } = useModals();

    function openTransferSendModal() {
      openModal(MODAL_TRANSFER_SEND, {
        isMultisig: true,
      });
    }

    return {
      ArrowSendIcon,
      openTransferSendModal,
    };
  },
});
</script>
