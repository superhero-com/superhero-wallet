<template>
  <TransferSendBase
    :protocol="protocol"
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
        :protocol="protocol"
        @success="currentStepConfig.onSuccess"
        @error="onChildError"
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
import type {
  TransferFormModel,
  TransferSendStep,
  TransferSendStepConfigRegistry,
  Protocol,
} from '@/types';
import {
  PROTOCOL_VIEW_TRANSFER_SEND,
  TRANSFER_SEND_STEPS,
} from '@/constants';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';
import {
  useBalances,
  useCurrencies,
} from '@/composables';

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
    protocol: { type: String as any as import('vue').PropType<Protocol>, required: true },
  },
  setup(props) {
    const { marketData } = useCurrencies();
    const { balance } = useBalances();

    const currentRenderedComponent = ref<Component>();
    const currentStep = ref<TransferSendStep>(TRANSFER_SEND_STEPS.form);
    const error = ref(false);
    const transferData = ref<TransferFormModel>({
      addresses: props.address ? [props.address] : [] as any[], // TODO change to string globally
      amount: props.amount,
      payload: props.payload,
      selectedAsset: ProtocolAdapterFactory
        .getAdapter(props.protocol)
        .getDefaultCoin(marketData.value!, +balance.value),
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

    function onChildError(val: any) {
      error.value = Boolean(val);
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
      onChildError,
      transferData,
      currentStepConfig,
      proceedToNextStep,
      editTransfer,
    };
  },
});
</script>
