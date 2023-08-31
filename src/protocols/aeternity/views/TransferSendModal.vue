<!-- eslint-disable vue/no-v-model-argument -->
<template>
  <TransferSendBase
    v-bind="$attrs"
    :protocol="PROTOCOL_AETERNITY"
    :current-step="currentStep"
    :edit-transfer="editTransfer"
    :proceed-to-next-step="proceedToNextStep"
    :hide-arrow-send-icon="isMultisig"
    :custom-primary-button-text="customPrimaryButtonText"
    :primary-button-disabled="isPrimaryButtonDisabled"
    @close="resolve"
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
import type {
  ITokenList,
  ResolveCallback,
  TransferSendStepExtended,
  TransferFormModel,
} from '@/types';

import { Encoded } from '@aeternity/aepp-sdk';
import { useI18n } from 'vue-i18n';
import { useStore } from 'vuex';
import { useState } from '@/composables/vuex';

import {
  PROTOCOL_AETERNITY,
  PROTOCOL_VIEW_TRANSFER_SEND,
  TRANSFER_SEND_STEPS,
} from '@/constants';
import { isUrlValid } from '@/utils';
import { useAeSdk } from '@/composables';
import { AE_AENS_DOMAIN } from '@/protocols/aeternity/config';

import TransferSendBase from '@/popup/components/Modals/TransferSendBase.vue';
import TransferSendForm from '../components/TransferSendForm.vue';
import TransferReviewTip from '../components/TransferReviewTip.vue';
import TransferReview from '../components/TransferReview.vue';

export default defineComponent({
  name: PROTOCOL_VIEW_TRANSFER_SEND,
  components: {
    TransferSendBase,
  },
  props: {
    resolve: { type: Function as PropType<ResolveCallback>, default: () => null },
    tokenContractId: { type: String, default: null },
    address: { type: String as PropType<Encoded.AccountAddress>, default: null },
    isMultisig: Boolean,
  },
  setup(props) {
    const { t } = useI18n();
    const store = useStore();
    const { isAeNodeReady } = useAeSdk({ store });

    const currentRenderedComponent = ref<Component>();
    const currentStep = ref<TransferSendStepExtended>(TRANSFER_SEND_STEPS.form);
    const error = ref(false);
    const transferData = ref<TransferFormModel>({
      amount: '',
      selectedAsset: undefined,
      payload: '',
    });

    const availableTokens = useState<ITokenList>('fungibleTokens', 'availableTokens');

    const isAddressChain = computed(() => !!transferData.value.address?.endsWith(AE_AENS_DOMAIN));

    const isAddressUrl = computed(() => (
      !isAddressChain.value
        && transferData.value.address
        && isUrlValid(transferData.value.address)
    ));

    const isPrimaryButtonDisabled = computed(() => (
      error.value
      || !isAeNodeReady.value
      || !transferData.value.address
      || !transferData.value.amount
    ));

    const customPrimaryButtonText = computed(() => {
      if (props.isMultisig) {
        return t('modals.multisigTxProposal.proposeAndApprove');
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

    const steps: Record<
        TransferSendStepExtended,
        { component: Component, onSuccess: () => void }
    > = {
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
    };

    const currentStepConfig = computed(() => steps[currentStep.value]);

    if (props.tokenContractId && availableTokens.value[props.tokenContractId]) {
      transferData.value.selectedAsset = availableTokens.value[props.tokenContractId];
    }
    if (props.address) {
      transferData.value.address = props.address;
    }

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
      isPrimaryButtonDisabled,
      customPrimaryButtonText,
      proceedToNextStep,
      editTransfer,
    };
  },
});
</script>
