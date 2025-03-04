<template>
  <TransferSendBase
    :current-step="currentStep"
    :sending-disabled="error
      || !transferData.addresses?.length
      || !transferData.amount"
    @close="resolve"
    @step-next="proceedToNextStep"
    @step-prev="editTransfer"
  >
    <template #content>
      <component
        :is="currentStepConfig.component"
        ref="currentRenderedComponent"
        v-model:transfer-data="transferData"
        @success="currentStepConfig.onSuccess"
        @error="(val: any) => error = val"
      />
    </template>
  </TransferSendBase>
</template>

<script lang="ts">
import {
  Component,
  PropType,
  computed,
  defineComponent,
  ref,
} from 'vue';
import type {
  TransferFormModel,
  TransferSendStep,
  TransferSendStepConfigRegistry,
  AssetList,
  AssetContractId,
} from '@/types';
import {
  PROTOCOLS,
  PROTOCOL_VIEW_TRANSFER_SEND,
  TRANSFER_SEND_STEPS,
} from '@/constants';
import { useFungibleTokens } from '@/composables';

import TransferSendBase, { transferSendModalRequiredProps } from '@/popup/components/Modals/TransferSendBase.vue';
import TransferReview from '../components/TransferReview.vue';
import TransferSendForm from '../components/TransferSendForm.vue';

export default defineComponent({
  name: PROTOCOL_VIEW_TRANSFER_SEND,
  components: {
    TransferSendBase,
  },
  props: {
    ...transferSendModalRequiredProps,
    tokenContractId: { type: String as PropType<AssetContractId>, default: null },
  },
  setup(props) {
    const { getProtocolAvailableTokens } = useFungibleTokens();

    const ethTokensAvailable = computed(() => getProtocolAvailableTokens(PROTOCOLS.ethereum));

    const currentRenderedComponent = ref<Component>();
    const currentStep = ref<TransferSendStep>(TRANSFER_SEND_STEPS.form);
    const error = ref(false);
    const transferData = ref<TransferFormModel>({
      addresses: props.address ? [props.address] : [] as any[], // TODO change to string globally
      amount: props.amount,
      payload: props.payload,
      selectedAsset: (props.tokenContractId)
        ? ethTokensAvailable.value[props.tokenContractId as keyof AssetList]
        : undefined,
    });

    function proceedToNextStep() {
      (currentRenderedComponent.value as any).submit();
    }

    function handleSendFormSuccess() {
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
      [TRANSFER_SEND_STEPS.review]: {
        component: TransferReview,
        onSuccess: props.resolve,
      },
    };

    const currentStepConfig = computed(() => steps[currentStep.value]!);

    return {
      TRANSFER_SEND_STEPS,
      currentRenderedComponent,
      steps,
      currentStep,
      error,
      transferData,
      currentStepConfig,
      proceedToNextStep,
      editTransfer,
    };
  },
});
</script>
