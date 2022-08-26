<template>
  <Modal
    class="transfer-send-modal"
    has-close-button
    from-bottom
    @close="closeModal"
  >
    <div class="relative">
      <transition name="fade-between">
        <component
          v-model="transferData"
          :is="currentStepConfig.component"
          :is-address-chain="isAddressChain"
          :is-address-url="isAddressUrl"
          ref="currentRenderedComponent"
          @success="currentStepConfig.onSuccess"
        />
      </transition>
    </div>

    <template #footer>
      <Button
        v-if="showEditButton"
        fill="secondary"
        text="Edit"
        class="btn-action-secondary"
        new-ui
        @click="editTransfer"
      />
      <Button
        class="btn-action-primary"
        new-ui
        :has-icon="showSendButton"
        :text="showSendButton ? $t('pages.send.send') : $t('modals.send.next')"
        @click="proceedToNextStep"
      >
        {{ showSendButton ? $t('pages.send.send') : $t('modals.send.next') }}
        <ArrowSendIcon v-if="showSendButton" />
      </Button>
    </template>
  </Modal>
</template>

<script>
import { MODAL_TRANSFER_SEND } from '../../../utils/constants';
import {
  validateTipUrl,
} from '../../../utils/helper';
import Modal from '../Modal.vue';
import Button from '../Button.vue';
import TransferSendForm from '../TransferSendForm.vue';
import TransferReview from '../TransferReview.vue';
import TransferReviewTip from '../TransferReviewTip.vue';
import ArrowSendIcon from '../../../../icons/arrow-send.svg?vue-component';

const STEP_FORM = 'form';
const STEP_REVIEW = 'review';
const STEP_REVIEW_TIP = 'tip';

export default {
  name: 'TransferSend',
  components: {
    Modal,
    Button,
    ArrowSendIcon,
  },
  data() {
    return {
      STEP_FORM,
      STEP_REVIEW,
      STEP_REVIEW_TIP,
      currentStep: STEP_FORM,
      transferData: {
        address: '',
        amount: null,
        selectedAsset: null,
      },
      steps: {
        [STEP_FORM]: {
          component: TransferSendForm,
          onSuccess: this.handleSendFormSuccess,
        },
        [STEP_REVIEW_TIP]: {
          component: TransferReviewTip,
          onSuccess: this.handleReviewTipSuccess,
        },
        [STEP_REVIEW]: {
          component: TransferReview,
          onSuccess: this.handleReviewSuccess,
        },
      },
    };
  },
  computed: {
    currentStepConfig() {
      return this.steps[this.currentStep];
    },
    showEditButton() {
      return [STEP_REVIEW_TIP, STEP_REVIEW].includes(this.currentStep);
    },
    showSendButton() {
      return this.currentStep === STEP_REVIEW;
    },
    isAddressChain() {
      return this.transferData.address.endsWith('.chain');
    },
    isAddressUrl() {
      return !this.isAddressChain && validateTipUrl(this.transferData.address);
    },
  },
  methods: {
    closeModal() {
      this.$store.commit('modals/closeByKey', MODAL_TRANSFER_SEND);
    },
    proceedToNextStep() {
      this.$refs.currentRenderedComponent.submit();
    },
    handleSendFormSuccess() {
      this.currentStep = (this.isAddressUrl)
        ? STEP_REVIEW_TIP
        : STEP_REVIEW;
    },
    handleReviewTipSuccess() {
      this.currentStep = STEP_REVIEW;
    },
    /**
     * Review success means that the transfer has been initiated
     * and the summary modal will be displayed by the `pendingTransactionHandler`
     * after the transfer is finished.
     */
    handleReviewSuccess() {
      this.closeModal();
    },
    editTransfer() {
      this.currentStep = STEP_FORM;
    },
  },
};
</script>

<style lang="scss" scoped>
.transfer-send-modal {
  .btn-action-secondary {
    flex-basis: 30%;
  }

  .btn-action-primary {
    flex-basis: 70%;
  }
}
</style>
