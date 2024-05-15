<template>
  <TransferSendBase
    :protocol="PROTOCOLS.aeternity"
    :current-step="currentStep"
    :hide-arrow-send-icon="isMultisig"
    :custom-primary-button-text="customPrimaryButtonText"
    :sending-disabled="isSendingDisabled"
    :is-air-gap="isAirGap"
    @close="resolve"
    @step-next="proceedToNextStep"
    @step-prev="editTransfer"
  >
    <template #content>
      <component
        :is="currentStepConfig.component"
        ref="currentRenderedComponent"
        v-model:transferData="transferData"
        :tx-raw="txRaw"
        :is-multisig="isMultisig"
        :is-air-gap="isAirGap"
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
  PropType,
  ref,
} from 'vue';
import { useI18n } from 'vue-i18n';

import type {
  AssetContractId,
  TransferFormModel,
  TransferSendStep,
  TransferSendStepConfigRegistry,
} from '@/types';
import {
  PROTOCOLS,
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
import TransferSignedTxReview from '../components/TransferSignedTxReview.vue';

export default defineComponent({
  name: PROTOCOL_VIEW_TRANSFER_SEND,
  components: {
    TransferSendBase,
  },
  props: {
    ...transferSendModalRequiredProps,
    tokenContractId: { type: String as PropType<AssetContractId>, default: null },
    isMultisig: Boolean,
    isAirGap: Boolean,
  },
  setup(props) {
    const { t } = useI18n();
    const { isAeNodeReady } = useAeSdk();
    const { getProtocolAvailableTokens } = useFungibleTokens();

    const currentRenderedComponent = ref<Component>();
    const currentStep = ref<TransferSendStep>(TRANSFER_SEND_STEPS.form);
    const error = ref(false);
    const txRaw = ref();
    const transferData = ref<TransferFormModel>({
      address: props.address as any, // TODO change to string globally
      amount: props.amount,
      payload: props.payload,
      selectedAsset: (props.tokenContractId)
        ? getProtocolAvailableTokens(PROTOCOLS.aeternity)[props.tokenContractId]
        : undefined,
    });

    const isAddressChain = computed(() => !!transferData.value.address?.endsWith(AE_AENS_DOMAIN));

    const isAddressUrl = computed(() => (
      !isAddressChain.value
      && transferData.value.address
      && isUrlValid(transferData.value.address)
    ));

    const showNextButton = computed(() => (
      currentStep.value === TRANSFER_SEND_STEPS.review
      && props.isAirGap
    ));

    const isSendingDisabled = computed(() => {
      if (showNextButton.value) {
        return (error.value || !isAeNodeReady.value);
      }
      return error.value
        || !isAeNodeReady.value
        || !transferData.value.address
        || !transferData.value.amount;
    });

    const customPrimaryButtonText = computed(() => {
      if (props.isMultisig) {
        return t('modals.multisigTxProposal.proposeAndApprove');
      }
      if (showNextButton.value) {
        return t('common.next');
      }
      return '';
    });

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

    function handleReviewSuccess() {
      if (props.isAirGap) {
        currentStep.value = TRANSFER_SEND_STEPS.airGapSign;
      } else {
        props.resolve();
      }
    }

    function handleAirGapSignReviewSuccess() {
      props.resolve();
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
        onSuccess: handleReviewSuccess,
      },
      [TRANSFER_SEND_STEPS.airGapSign]: {
        component: TransferSignedTxReview,
        onSuccess: handleAirGapSignReviewSuccess,
      },
    };

    const currentStepConfig = computed(() => steps[currentStep.value]!);

    return {
      TRANSFER_SEND_STEPS,
      PROTOCOLS,
      currentRenderedComponent,
      steps,
      currentStep,
      error,
      txRaw,
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
