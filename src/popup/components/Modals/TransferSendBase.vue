<template>
  <Modal
    class="transfer-send-base"
    has-close-button
    from-bottom
    :no-padding-bottom="currentStep === TRANSFER_SEND_STEPS.form"
    @close="$emit('close')"
  >
    <div class="relative">
      <transition name="fade-between">
        <slot name="content" />
      </transition>
    </div>
    <template #footer>
      <BtnMain
        v-if="showEditButton"
        variant="muted"
        :text="$t('common.edit')"
        class="button-action-secondary"
        data-cy="edit"
        @click="$emit('step-prev')"
      />
      <BtnMain
        class="button-action-primary"
        :disabled="!isOnline || sendingDisabled"
        :icon="primaryButtonIcon"
        :text="primaryButtonText"
        data-cy="next-step-button"
        @click="$emit('step-next')"
      />
    </template>
  </Modal>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  PropType,
} from 'vue';
import type { ResolveCallback, TransferSendStep } from '@/types';
import { useI18n } from 'vue-i18n';

import { TRANSFER_SEND_STEPS } from '@/constants';
import { useAccounts, useConnection } from '@/composables';

import ArrowSendIcon from '@/icons/arrow-send.svg?vue-component';
import QrScanIcon from '@/icons/qr-scan.svg?vue-component';

import Modal from '../Modal.vue';
import BtnMain from '../buttons/BtnMain.vue';

export const transferSendModalRequiredProps = {
  /**
   * Resolving means that the transfer has been initiated and the summary modal
   * will be displayed by the `pendingTransactionHandler` after the transfer is finished.
   */
  resolve: { type: Function as PropType<ResolveCallback>, default: () => null },
  address: { type: String, default: undefined },
  amount: { type: String, default: '' },
  payload: { type: String, default: '' },
};

export default defineComponent({
  name: 'TransferSendBase',
  components: {
    Modal,
    BtnMain,
  },
  props: {
    customPrimaryButtonText: { type: String, default: '' },
    currentStep: { type: String as PropType<TransferSendStep>, required: true },
    sendingDisabled: Boolean,
    hideArrowSendIcon: Boolean,
  },
  emits: [
    'close',
    'step-prev',
    'step-next',
  ],
  setup(props) {
    const { t } = useI18n();
    const { isOnline } = useConnection();
    const { isActiveAccountAirGap } = useAccounts();

    const showEditButton = computed(() => [
      TRANSFER_SEND_STEPS.review,
      TRANSFER_SEND_STEPS.reviewTip,
      TRANSFER_SEND_STEPS.airGapSign,
    ].includes(props.currentStep as any));

    const showSendButton = computed(() => [
      TRANSFER_SEND_STEPS.review,
      TRANSFER_SEND_STEPS.airGapSign,
    ].includes(props.currentStep as any));

    const showNextButton = computed(() => (
      props.currentStep === TRANSFER_SEND_STEPS.review && isActiveAccountAirGap.value
    ));

    const primaryButtonText = computed(() => {
      if (props.customPrimaryButtonText) {
        return props.customPrimaryButtonText;
      }
      if (!showSendButton.value) {
        return t('common.next');
      }
      return t('common.send');
    });

    const primaryButtonIcon = computed(() => {
      if (showSendButton.value && !showNextButton.value && !props.hideArrowSendIcon) {
        return ArrowSendIcon;
      }
      return null;
    });

    return {
      isOnline,
      primaryButtonText,
      primaryButtonIcon,
      showEditButton,
      showSendButton,
      ArrowSendIcon,
      QrScanIcon,
      TRANSFER_SEND_STEPS,
    };
  },
});
</script>

<style lang="scss" scoped>
.transfer-send-base {
  .button-action-secondary {
    flex-basis: 30%;
  }

  .button-action-primary {
    flex-basis: 70%;
  }
}
</style>
