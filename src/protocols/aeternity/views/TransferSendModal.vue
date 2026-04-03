<template>
  <TransferSendBase
    :protocol="PROTOCOLS.aeternity"
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
        v-model:transfer-data="transferData"
        :is-multisig="isMultisig"
        :is-address-chain="isAddressChain"
        :is-address-url="isAddressUrl"
        @success="currentStepConfig.onSuccess"
        @error="handleError"
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
  watch,
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
import { useAccounts, useAeSdk, useFungibleTokens } from '@/composables';
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
  },
  setup(props) {
    const { t } = useI18n();
    const { isAeNodeReady } = useAeSdk();
    const { getProtocolAvailableTokens, loadSingleToken } = useFungibleTokens();
    const { isActiveAccountAirGap } = useAccounts();

    const currentRenderedComponent = ref<Component>();
    const currentStep = ref<TransferSendStep>(TRANSFER_SEND_STEPS.form);
    const error = ref(false);
    const aeternityTokens = computed(() => getProtocolAvailableTokens(PROTOCOLS.aeternity));
    const transferData = ref<TransferFormModel>({
      addresses: props.address ? [props.address] : [] as any[], // TODO change to string globally
      amount: props.amount,
      payload: props.payload,
      selectedAsset: (props.tokenContractId)
        ? aeternityTokens.value[props.tokenContractId]
        : undefined,
    });

    const isAddressChain = computed(() => (
      !!transferData.value.addresses?.[0]?.endsWith(AE_AENS_DOMAIN)));

    const isAddressUrl = computed(() => (
      !isAddressChain.value
      && transferData.value.addresses
      && isUrlValid(transferData.value.addresses[0])
    ));

    const showNextButton = computed(() => (
      currentStep.value === TRANSFER_SEND_STEPS.review
      && isActiveAccountAirGap.value
    ));

    const isSendingDisabled = computed(() => (
      error.value
      || !isAeNodeReady.value
      || (
        !showNextButton.value
        && (!transferData.value.addresses?.length || !transferData.value.amount)
      )
    ));

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
      if (isActiveAccountAirGap.value && !props.isMultisig) {
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

    function handleError(val: boolean) {
      error.value = val;
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

    watch(
      () => props.tokenContractId,
      async (contractId) => {
        if (contractId) {
          await loadSingleToken(contractId, PROTOCOLS.aeternity);
        }
      },
      { immediate: true },
    );

    /**
     * Do not overwrite a user-chosen asset when the token map refreshes (e.g. balance polling).
     * Sync when the deeplink contract id prop changes, or selection is unset / matches that prop.
     */
    const lastSyncedTokenContractIdProp = ref<AssetContractId | null>(null);

    watch(
      [() => props.tokenContractId, aeternityTokens],
      ([contractId, tokens]) => {
        if (!contractId || !tokens[contractId]) {
          return;
        }
        const token = tokens[contractId];
        const propChanged = contractId !== lastSyncedTokenContractIdProp.value;
        if (propChanged) {
          lastSyncedTokenContractIdProp.value = contractId;
          transferData.value.selectedAsset = token;
          return;
        }
        const sel = transferData.value.selectedAsset?.contractId;
        if (sel === undefined || sel === contractId) {
          transferData.value.selectedAsset = token;
        }
      },
      { immediate: true },
    );

    return {
      TRANSFER_SEND_STEPS,
      PROTOCOLS,
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
      handleError,
    };
  },
});
</script>
