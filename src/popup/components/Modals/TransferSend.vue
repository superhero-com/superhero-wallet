<template>
  <Modal
    class="transfer-send-modal"
    has-close-button
    from-bottom
    :body-without-padding-bottom="currentStep === STEPS.form"
    @close="closeModal"
  >
    <div class="relative">
      <transition name="fade-between">
        <component
          :is="currentStepConfig.component"
          ref="currentRenderedComponent"
          v-model="transferData"
          :is-multisig="isMultisig"
          :is-address-chain="isAddressChain"
          :is-address-url="isAddressUrl"
          @success="currentStepConfig.onSuccess"
          @error="(val) => error = val"
        />
      </transition>
    </div>

    <template #footer>
      <BtnMain
        v-if="showEditButton"
        variant="muted"
        :text="$t('pages.send.editTxDetails')"
        class="button-action-secondary"
        data-cy="edit"
        extra-padded
        @click="editTransfer"
      />
      <BtnMain
        class="button-action-primary"
        :disabled="error || !isConnected || !transferData.address || !transferData.amount"
        :icon="(showSendButton && !isMultisig) ? ArrowSendIcon : null"
        :text="primaryButtonText"
        data-cy="next-step-button"
        @click="proceedToNextStep"
      />
    </template>
  </Modal>
</template>

<script lang="ts">
import { computed, defineComponent, ref } from '@vue/composition-api';
import BigNumber from 'bignumber.js';
import type { ITokenList, ObjectValues } from '../../../types';
import { IFormModel } from '../../../composables';
import { AENS_DOMAIN, MODAL_TRANSFER_SEND, validateTipUrl } from '../../utils';
import { useGetter, useState } from '../../../composables/vuex';

import Modal from '../Modal.vue';
import BtnMain from '../buttons/BtnMain.vue';
import TransferSendForm from '../TransferSendForm.vue';
import TransferReview from '../TransferReview.vue';
import TransferReviewTip from '../TransferReviewTip.vue';
import ArrowSendIcon from '../../../icons/arrow-send.svg?vue-component';

export interface TransferFormModel extends IFormModel {
  fee?: BigNumber
  total?: number
  invoiceContract?: any
  invoiceId?: any
  note?: string
  payload: string
}

const STEPS = {
  form: 'form',
  review: 'review',
  reviewTip: 'tip',
} as const;
type Step = ObjectValues<typeof STEPS>;

export default defineComponent({
  name: 'TransferSend',
  components: {
    Modal,
    BtnMain,
  },
  props: {
    tokenContractId: { type: String, default: null },
    address: { type: String, default: null },
    isMultisig: Boolean,
  },
  setup(props, { root }) {
    const currentRenderedComponent = ref<Vue.Component>();
    const currentStep = ref<Step>(STEPS.form);
    const error = ref(false);
    const transferData = ref<TransferFormModel>({
      address: '', amount: '', selectedAsset: undefined, payload: '',
    });

    const availableTokens = useState<ITokenList>('fungibleTokens', 'availableTokens');
    const isConnected = useGetter<boolean>('isConnected');

    const showEditButton = computed(() => [
      STEPS.review,
      STEPS.reviewTip,
    ].includes(currentStep.value as any));
    const showSendButton = computed(() => currentStep.value === STEPS.review);
    const isAddressChain = computed(() => !!transferData.value.address?.endsWith(AENS_DOMAIN));
    const isAddressUrl = computed(() => (
      !isAddressChain.value
      && transferData.value.address
      && validateTipUrl(transferData.value.address)
    ));
    const primaryButtonText = computed(() => {
      if (!showSendButton.value) {
        return root.$t('modals.send.next');
      }
      if (props.isMultisig) {
        return root.$t('modals.multisigTxProposal.proposeAndApprove');
      }
      return root.$t('pages.send.send');
    });

    function closeModal() {
      root.$store.commit('modals/closeByKey', MODAL_TRANSFER_SEND);
    }

    function proceedToNextStep() {
      (currentRenderedComponent.value as any).submit();
    }

    function handleSendFormSuccess() {
      currentStep.value = (isAddressUrl.value)
        ? STEPS.reviewTip
        : STEPS.review;
    }

    function handleReviewTipSuccess() {
      currentStep.value = STEPS.review;
    }

    /**
     * Review success means that the transfer has been initiated
     * and the summary modal will be displayed by the `pendingTransactionHandler`
     * after the transfer is finished.
     */
    function handleReviewSuccess() {
      closeModal();
    }

    function editTransfer() {
      error.value = false;
      currentStep.value = STEPS.form;
    }

    const steps: Record<Step, { component: Vue.Component, onSuccess: () => void }> = {
      [STEPS.form]: {
        component: TransferSendForm,
        onSuccess: handleSendFormSuccess,
      },
      [STEPS.reviewTip]: {
        component: TransferReviewTip,
        onSuccess: handleReviewTipSuccess,
      },
      [STEPS.review]: {
        component: TransferReview,
        onSuccess: handleReviewSuccess,
      },
    };

    const currentStepConfig = computed(() => steps[currentStep.value]);

    if (props.tokenContractId && availableTokens.value[props.tokenContractId]) {
      transferData.value.selectedAsset = availableTokens.value[props.tokenContractId];
    }
    if (props.address) {
      transferData.value.address = props.address;
    }

    return {
      STEPS,
      ArrowSendIcon,
      isConnected,
      currentRenderedComponent,
      steps,
      currentStep,
      error,
      transferData,
      currentStepConfig,
      isAddressChain,
      isAddressUrl,
      showEditButton,
      showSendButton,
      primaryButtonText,
      closeModal,
      proceedToNextStep,
      editTransfer,
    };
  },
});
</script>

<style lang="scss" scoped>
.transfer-send-modal {
  .button-action-secondary {
    flex-basis: 30%;
  }

  .button-action-primary {
    flex-basis: 70%;
  }
}
</style>
