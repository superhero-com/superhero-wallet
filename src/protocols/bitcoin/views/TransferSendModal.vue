<!-- eslint-disable vue/no-v-model-argument -->
<template>
  <TransferSendBase
    v-bind="$attrs"
    :protocol="PROTOCOL_BITCOIN"
    :current-step="currentStep"
    :edit-transfer="editTransfer"
    :proceed-to-next-step="proceedToNextStep"
    :primary-button-disabled="error || !transferData.address || !transferData.amount"
    @close="resolve"
  >
    <template #content>
      <component
        :is="currentStepConfig.component"
        ref="currentRenderedComponent"
        v-model:transferData="transferData"
        @success="currentStepConfig.onSuccess"
        @error="(val) => error = val"
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
import { Encoded } from '@aeternity/aepp-sdk';
import type {
  ResolveCallback,
  TransferFormModel,
  TransferSendStep,
} from '@/types';
import {
  useBalances,
  useCurrencies,
} from '@/composables';

import TransferSendBase from '@/popup/components/Modals/TransferSendBase.vue';
import {
  PROTOCOL_BITCOIN,
  PROTOCOL_VIEW_TRANSFER_SEND,
  TRANSFER_SEND_STEPS,
} from '@/constants';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';
import TransferReview from '../components/TransferReview.vue';
import TransferSendForm from '../components/TransferSendForm.vue';

export default defineComponent({
  name: PROTOCOL_VIEW_TRANSFER_SEND,
  components: {
    TransferSendBase,
  },
  props: {
    resolve: { type: Function as PropType<ResolveCallback>, default: () => null },
    tokenContractId: { type: String, default: null },
    address: { type: String as PropType<Encoded.AccountAddress>, default: null },
  },
  setup(props) {
    const { marketData } = useCurrencies();
    const { balance } = useBalances();

    const currentRenderedComponent = ref<Component>();
    const currentStep = ref<TransferSendStep>(TRANSFER_SEND_STEPS.form);
    const error = ref(false);
    const transferData = ref<TransferFormModel>({
      amount: '',
      selectedAsset: ProtocolAdapterFactory
        .getAdapter(PROTOCOL_BITCOIN)
        .getDefaultCoin(marketData.value!, +balance.value),
      payload: '',
    });

    function proceedToNextStep() {
      (currentRenderedComponent.value as any).submit();
    }

    function handleSendFormSuccess() {
      currentStep.value = TRANSFER_SEND_STEPS.review;
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
      currentStep.value = TRANSFER_SEND_STEPS.form;
    }

    const steps: Record<TransferSendStep, { component: Component, onSuccess: () => void }> = {
      [TRANSFER_SEND_STEPS.form]: {
        component: TransferSendForm,
        onSuccess: handleSendFormSuccess,
      },
      [TRANSFER_SEND_STEPS.review]: {
        component: TransferReview,
        onSuccess: handleReviewSuccess,
      },
    };

    const currentStepConfig = computed(() => steps[currentStep.value]);

    if (props.address) {
      transferData.value.address = props.address;
    }

    return {
      TRANSFER_SEND_STEPS,
      PROTOCOL_BITCOIN,
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
