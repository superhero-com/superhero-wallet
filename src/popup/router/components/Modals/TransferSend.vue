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
        v-model="formModel"
      />

      <div v-else-if="currentStep === STEP_TIP">
        <h2>TIP</h2>
      </div>

      <div v-else-if="currentStep === STEP_REVIEW">
        <h2>REVIEW</h2>
      </div>

      <div v-else-if="currentStep === STEP_SUCCESS">
        <h2>SUCCESS</h2>
      </div>
    </transition>

    <template #footer>
      <template v-if="isSuccess">
        <Button
          fill="secondary"
          text="View in explorer"
          class="btn-primary-action"
          new-ui
        />
        <Button
          :text="$t('ok')"
          new-ui
          @click="closeModal"
        />
      </template>
      <template v-else>
        <Button
          v-if="showEditButton"
          fill="secondary"
          text="Edit"
          class="btn-secondary-action"
          new-ui
          @click="editTransfer"
        />
        <Button
          v-if="showSendButton"
          new-ui
          class="btn-primary-action"
          text="Send"
          @click="send"
        />
        <Button
          v-else
          class="btn-primary-action"
          new-ui
          :text="$t('modals.send.next')"
          @click="proceedToNextStep"
        />
      </template>
    </template>
  </Modal>
</template>

<script>
import { MODAL_TRANSFER_SEND } from '../../../utils/constants';
import {
  validateTipUrl,
} from '../../../utils/helper';
import Modal from '../Modal.vue';
import TransferSendForm from '../TransferSendForm.vue';
import Button from '../Button.vue';

const STEP_FORM = 'form';
const STEP_TIP = 'tip';
const STEP_REVIEW = 'review';
const STEP_SUCCESS = 'success';

export default {
  name: 'TransferSend',
  components: {
    Modal,
    Button,
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

<style lang="scss" scoped>
.transfer-send-modal {
  .btn-secondary-action {
    flex-basis: 40%;
  }

  .btn-primary-action {
    flex-basis: 60%;
  }
}
</style>
