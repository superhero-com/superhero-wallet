<template>
  <Modal
    class="transfer-send-base"
    has-close-button
    from-bottom
    :body-without-padding-bottom="currentStep === TRANSFER_SEND_STEPS.form"
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
        @click="editTransfer"
      />
      <BtnMain
        class="button-action-primary"
        :disabled="primaryButtonDisabled"
        :icon="(showSendButton && hideArrowSendIcon) ? ArrowSendIcon : null"
        :text="primaryButtonText"
        data-cy="next-step-button"
        @click="proceedToNextStep"
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
import type { TransferSendStep } from '@/types';
import { useI18n } from 'vue-i18n';

import { TRANSFER_SEND_STEPS } from '@/constants';
import ArrowSendIcon from '@/icons/arrow-send.svg?vue-component';
import Modal from '../Modal.vue';
import BtnMain from '../buttons/BtnMain.vue';

export default defineComponent({
  name: 'TransferSendBase',
  components: {
    Modal,
    BtnMain,
  },
  props: {
    editTransfer: { type: Function, default: () => null },
    proceedToNextStep: { type: Function, default: () => null },
    customPrimaryButtonText: { type: String, default: '' },
    currentStep: { type: String as PropType<TransferSendStep>, required: true },
    primaryButtonDisabled: Boolean,
    hideArrowSendIcon: Boolean,
  },
  setup(props) {
    const { t } = useI18n();

    const showEditButton = computed(() => [
      TRANSFER_SEND_STEPS.review,
      TRANSFER_SEND_STEPS.reviewTip,
    ].includes(props.currentStep as any));

    const showSendButton = computed(() => props.currentStep === TRANSFER_SEND_STEPS.review);

    const primaryButtonText = computed(() => {
      if (props.customPrimaryButtonText) {
        return props.customPrimaryButtonText;
      }
      if (!showSendButton.value) {
        return t('common.next');
      }
      return t('common.send');
    });

    return {
      primaryButtonText,
      showEditButton,
      showSendButton,
      ArrowSendIcon,
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
