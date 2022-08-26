<template>
  <Modal
    class="transfer-send-modal"
    has-close-button
    from-bottom
    @close="closeModal"
  >
    <transition name="fade-between">
      <TransferSendForm
        v-if="currentStep === STEP_FORM"
        :token-symbol="tokenSymbol"
        @submit="handleSubmit"
      />

      <template v-else-if="currentStep === STEP_TIP">
        <ReviewTip
          v-bind="formData"
          :token-symbol="tokenSymbol"
          @edit="editTransfer"
          @submit="handleTipSubmit"
        />
      </template>

      <template v-else-if="currentStep === STEP_REVIEW">
        <ReviewTransfer
          v-bind="formData"
          :token-symbol="tokenSymbol"
          @edit="editTransfer"
        />
      </template>

      <!--      TODO - This one opens in new modal after the transaction is complete. -->
      <!--      TODO - ^^ Check pendingTransactionHandler.js-->
      <template v-else-if="currentStep === STEP_SUCCESS">
        <h2>SUCCESS</h2>
      </template>
    </transition>
    <!--    TODO - consider moving to certain views -->
    <!--    <template #footer>-->
    <!--      <template v-if="isSuccess">-->
    <!--        <Button-->
    <!--          fill="secondary"-->
    <!--          text="View in explorer"-->
    <!--          class="btn-primary-action"-->
    <!--          new-ui-->
    <!--        />-->
    <!--        <Button-->
    <!--          :text="$t('ok')"-->
    <!--          new-ui-->
    <!--          @click="closeModal"-->
    <!--        />-->
    <!--      </template>-->
    <!--      <template v-else>-->
    <!--        <Button-->
    <!--          v-if="showEditButton"-->
    <!--          fill="secondary"-->
    <!--          text="Edit"-->
    <!--          class="btn-secondary-action"-->
    <!--          new-ui-->
    <!--          @click="editTransfer"-->
    <!--        />-->
    <!--        <Button-->
    <!--          v-if="showSendButton"-->
    <!--          new-ui-->
    <!--          class="btn-primary-action"-->
    <!--          text="Send"-->
    <!--          @click="send"-->
    <!--        />-->
    <!--        <Button-->
    <!--          v-else-->
    <!--          class="btn-primary-action"-->
    <!--          new-ui-->
    <!--          :text="$t('modals.send.next')"-->
    <!--          @click="proceedToNextStep"-->
    <!--        />-->
    <!--      </template>-->
    <!--    </template>-->
  </Modal>
</template>

<script>
import { MODAL_TRANSFER_SEND } from '../../../utils/constants';
import {
  validateTipUrl,
} from '../../../utils/helper';
import Modal from '../Modal.vue';
import TransferSendForm from '../TransferSendForm.vue';
import ReviewTip from '../ReviewTip.vue';
import ReviewTransfer from '../ReviewTransfer.vue';

const STEP_FORM = 'form';
const STEP_TIP = 'tip';
const STEP_REVIEW = 'review';
const STEP_SUCCESS = 'success';

export default {
  name: 'TransferSend',
  components: {
    ReviewTransfer,
    ReviewTip,
    Modal,
    TransferSendForm,
  },
  data: () => ({
    STEP_FORM,
    STEP_TIP,
    STEP_REVIEW,
    STEP_SUCCESS,
    currentStep: STEP_FORM,
    isSuccess: false,
    formModel: {},
  }),
  computed: {
    showEditButton() {
      return [STEP_TIP, STEP_REVIEW].includes(this.currentStep);
    },
    showSendButton() {
      return this.currentStep === STEP_REVIEW;
    },
    isAddressAnUrl() {
      return this.formModel.address ? validateTipUrl(this.formModel.address) : false;
    },
  },
  methods: {
    closeModal() {
      this.$store.commit('modals/closeByKey', MODAL_TRANSFER_SEND);
    },
    proceedToNextStep() {
      this.currentStep = STEP_REVIEW;
    },
    handleSubmit({ nextStep, formData }) {
      console.log({ formData });
      this.currentStep = nextStep;
      this.formData = formData;
    },
    handleTipSubmit(data) {
      this.handleSubmit({ nextStep: STEP_REVIEW, formData: { ...this.formData, ...data } });
    },
    editTransfer() {
      this.currentStep = STEP_FORM;
    },
    send() {
      this.currentStep = STEP_SUCCESS;
      this.isSuccess = true;
    },
  },
};
</script>
