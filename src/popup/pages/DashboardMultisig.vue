<template>
  <IonPage>
    <IonContent class="ion-padding ion-content-bg">
      <DashboardWrapper v-if="pageIsActive">
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
    </IonContent>
  </IonPage>
</template>

<script lang="ts">
import {
  IonPage,
  IonContent,
  onIonViewWillEnter,
  onIonViewDidLeave,
} from '@ionic/vue';
import { defineComponent, ref } from 'vue';

import { MODAL_TRANSFER_SEND } from '@/constants';
import { useModals } from '@/composables';

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
    IonPage,
    IonContent,
  },
  setup() {
    const pageIsActive = ref(true);

    const { openModal } = useModals();

    function openTransferSendModal() {
      openModal(MODAL_TRANSFER_SEND, {
        isMultisig: true,
      });
    }

    onIonViewWillEnter(() => {
      pageIsActive.value = true;
    });

    onIonViewDidLeave(() => {
      pageIsActive.value = false;
    });

    return {
      pageIsActive,
      ArrowSendIcon,
      openTransferSendModal,
    };
  },
});
</script>
