<!-- eslint-disable vue/no-v-model-argument -->
<template>
  <Modal
    class="transfer-send-modal"
    has-close-button
    from-bottom
    :body-without-padding-bottom="currentStep === STEPS.form"
    @close="resolve()"
  >
    <div class="relative">
      <transition name="fade-between">
        <component
          :is="currentStepConfig.component"
          ref="currentRenderedComponent"
          v-model:transferData="transferData"
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
        :text="$t('common.edit')"
        class="button-action-secondary"
        data-cy="edit"
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
import {
  Component,
  computed,
  defineComponent,
  PropType,
  ref,
} from 'vue';
import BigNumber from 'bignumber.js';
import { useI18n } from 'vue-i18n';
import { Encoded } from '@aeternity/aepp-sdk';
import type { ITokenList, ObjectValues, ResolveCallback } from '../../../types';
import { IFormModel } from '../../../composables';
import { AENS_DOMAIN, validateTipUrl } from '../../utils';
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
    resolve: { type: Function as PropType<ResolveCallback>, default: () => null },
    tokenContractId: { type: String, default: null },
    address: { type: String as PropType<Encoded.AccountAddress>, default: null },
    isMultisig: Boolean,
  },
  setup(props) {
    const { t } = useI18n();

    const currentRenderedComponent = ref<Component>();
    const currentStep = ref<Step>(STEPS.form);
    const error = ref(false);
    const transferData = ref<TransferFormModel>({
      amount: '', selectedAsset: undefined, payload: '',
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
        return t('common.next');
      }
      if (props.isMultisig) {
        return t('modals.multisigTxProposal.proposeAndApprove');
      }
      return t('common.send');
    });

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
      props.resolve();
    }

    function editTransfer() {
      error.value = false;
      currentStep.value = STEPS.form;
    }

    const steps: Record<Step, { component: Component, onSuccess: () => void }> = {
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
