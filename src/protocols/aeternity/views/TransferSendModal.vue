<template>
  <TransferSendBase
    :protocol="PROTOCOL_AETERNITY"
    :current-step="currentStep"
    :hide-arrow-send-icon="isMultisig"
    :custom-primary-button-text="customPrimaryButtonText"
    :sending-disabled="isSendingDisabled"
    @close="resolve"
    @step-next="proceedToNextStep"
    @step-prev="editTransfer"
  >
    <template #content>
      <component
        :is="currentStepConfig.component"
        ref="currentRenderedComponent"
        v-model:transferData="transferData"
        :is-multisig="isMultisig"
        :is-address-chain="isAddressChain"
        :is-address-url="isAddressUrl"
        @success="currentStepConfig.onSuccess"
        @error="(val: any) => error = val"
      />
    </template>
  </TransferSendBase>
</template>

<script lang="ts">
import {
  Component,
  computed,
  defineComponent,
  ref,
} from 'vue';
import { useI18n } from 'vue-i18n';

import type {
  TransferFormModel,
  TransferSendStep,
  TransferSendStepConfigRegistry,
} from '@/types';
import {
  PROTOCOL_AETERNITY,
  PROTOCOL_VIEW_TRANSFER_SEND,
  TRANSFER_SEND_STEPS,
} from '@/constants';
import { isUrlValid } from '@/utils';
import { useAeSdk, useFungibleTokens } from '@/composables';
import { AE_AENS_DOMAIN } from '@/protocols/aeternity/config';

import TransferSendBase, { transferSendModalRequiredProps } from '@/popup/components/Modals/TransferSendBase.vue';
import TransferSendForm from '../components/TransferSendForm.vue';
import TransferReviewTip from '../components/TransferReviewTip.vue';
import TransferReview from '../components/TransferReview.vue';

export default defineComponent({
  name: PROTOCOL_VIEW_TRANSFER_SEND,
  components: {
    TransferSendBase,
  },
  props: {
    ...transferSendModalRequiredProps,
    tokenContractId: { type: String, default: null },
    isMultisig: Boolean,
  },
  setup(props) {
    const { t } = useI18n();
    const { isAeNodeReady } = useAeSdk();
    const { availableTokens } = useFungibleTokens();

    const currentRenderedComponent = ref<Component>();
    const currentStep = ref<TransferSendStep>(TRANSFER_SEND_STEPS.form);
    const error = ref(false);
    const transferData = ref<TransferFormModel>({
      address: props.address as any, // TODO change to string globally
      amount: props.amount,
      payload: props.payload,
      selectedAsset: (props.tokenContractId)
        ? availableTokens.value[props.tokenContractId]
        : undefined,
    });

    const isAddressChain = computed(() => !!transferData.value.address?.endsWith(AE_AENS_DOMAIN));

    const isAddressUrl = computed(() => (
      !isAddressChain.value
      && transferData.value.address
      && isUrlValid(transferData.value.address)
    ));

    const isSendingDisabled = computed(() => (
      error.value
      || !isAeNodeReady.value
      || !transferData.value.address
      || !transferData.value.amount
    ));

    const customPrimaryButtonText = computed(() => (props.isMultisig)
      ? t('modals.multisigTxProposal.proposeAndApprove')
      : '');

    function proceedToNextStep() {
      (currentRenderedComponent.value as any).submit();
    }

    function handleSendFormSuccess() {
      currentStep.value = (isAddressUrl.value)
        ? TRANSFER_SEND_STEPS.reviewTip
        : TRANSFER_SEND_STEPS.review;
    }

    function handleReviewTipSuccess() {
      currentStep.value = TRANSFER_SEND_STEPS.review;
    }

    function editTransfer() {
      error.value = false;
      currentStep.value = TRANSFER_SEND_STEPS.form;
    }

    const steps: TransferSendStepConfigRegistry = {
      [TRANSFER_SEND_STEPS.form]: {
        component: TransferSendForm,
        onSuccess: handleSendFormSuccess,
      },
      [TRANSFER_SEND_STEPS.reviewTip]: {
        component: TransferReviewTip,
        onSuccess: handleReviewTipSuccess,
      },
      [TRANSFER_SEND_STEPS.review]: {
        component: TransferReview,
        onSuccess: props.resolve,
      },
    };

    const currentStepConfig = computed(() => steps[currentStep.value]!);

    return {
      TRANSFER_SEND_STEPS,
      PROTOCOL_AETERNITY,
      currentRenderedComponent,
      steps,
      currentStep,
      error,
      transferData,
      currentStepConfig,
      isAddressChain,
      isAddressUrl,
      isSendingDisabled,
      customPrimaryButtonText,
      proceedToNextStep,
      editTransfer,
    };
  },
});
</script>
