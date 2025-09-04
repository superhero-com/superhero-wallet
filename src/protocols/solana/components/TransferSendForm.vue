<template>
  <TransferSendFormBase
    v-bind="$attrs"
    :transfer-data="transferData"
    :fee="numericFee"
    :max-fee="numericMaxFee"
    :fee-symbol="SOL_COIN_SYMBOL"
    :protocol="PROTOCOLS.solana"
    :custom-title="$t('modals.send.sendAsset', { name: SOL_PROTOCOL_NAME })"
    class="transfer-send-form"
  >
    <template #recipient>
      <TransferSendRecipient
        v-model="formModel.addresses"
        :max-recipients="10"
        :placeholder="recipientPlaceholderText"
        :errors="errors"
        :protocol="PROTOCOLS.solana"
        :validation-rules="{ account_address: [PROTOCOLS.solana] }"
        @openQrModal="scanTransferQrCode()"
      />
    </template>

    <template #amount>
      <TransferSendAmount
        v-model="formModel.amount"
        :errors="errors"
        :selected-asset="formModel.selectedAsset"
        :protocol="PROTOCOLS.solana"
        :blink-on-change="shouldUseMaxAmount"
        :validation-rules="{
          ...+balance.minus(maxFee) > 0
            ? { max_value: max }
            : {},
          enough_coin: [maxFee.toString(), SOL_COIN_SYMBOL],
        }"
        @update:model-value="shouldUseMaxAmount = false"
        @asset-selected="handleAssetChange"
      >
        <template #label-after>
          <BtnMaxAmount
            :is-max="shouldUseMaxAmount"
            @click="toggleMaxAmount"
          />
        </template>
      </TransferSendAmount>
    </template>

    <template #extra>
      <DetailsItem
        v-show="activeNetwork.type !== NETWORK_TYPE_TESTNET"
        :label="$t('transaction.fee')"
      />
    </template>
  </TransferSendFormBase>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  nextTick,
  onMounted,
  onUnmounted,
  PropType,
  ref,
  watch,
} from 'vue';
import { useI18n } from 'vue-i18n';
import BigNumber from 'bignumber.js';

import type { AssetContractId, IAsset, TransferFormModel } from '@/types';
import {
  useAccountAssetsList,
  useBalances,
  useCurrencies,
  useNetworks,
  useAccounts,
} from '@/composables';
import { useSolFeeCalculation } from '@/protocols/solana/composables/solFeeCalculation';
import { useTransferSendForm } from '@/composables/transferSendForm';
import { useSolMaxAmount } from '@/protocols/solana/composables/solMaxAmount';
import { NETWORK_TYPE_TESTNET, PROTOCOLS } from '@/constants';
import { executeAndSetInterval } from '@/utils';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';
import { SOL_COIN_SYMBOL, SOL_PROTOCOL_NAME } from '@/protocols/solana/config';

import DetailsItem from '@/popup/components/DetailsItem.vue';
import TransferSendFormBase from '@/popup/components/TransferSendFormBase.vue';
import TransferSendRecipient from '@/popup/components/TransferSend/TransferSendRecipient.vue';
import TransferSendAmount from '@/popup/components/TransferSend/TransferSendAmount.vue';
// import TransactionSpeedPicker from '@/popup/components/TransactionSpeedPicker.vue';
import BtnMaxAmount from '@/popup/components/buttons/BtnMaxAmount.vue';

export default defineComponent({
  name: 'SolTransferSendForm',
  components: {
    BtnMaxAmount,
    DetailsItem,
    TransferSendAmount,
    TransferSendRecipient,
    TransferSendFormBase,
  },
  model: {
    prop: 'transferData',
  },
  props: {
    transferData: { type: Object as PropType<TransferFormModel>, required: true },
  },
  emits: [
    'update:transferData',
    'success',
    'error',
  ],
  setup(props, { emit }) {
    const { t } = useI18n();
    const { activeNetwork } = useNetworks();
    const { marketData } = useCurrencies();
    const { balance } = useBalances();
    const { activeAccount } = useAccounts();
    const { accountAssets } = useAccountAssetsList();

    function getSelectedAssetValue(assetContractId?: AssetContractId, selectedAsset?: IAsset) {
      if (assetContractId) {
        return accountAssets.value.find(({ contractId }) => contractId === assetContractId);
      } if (!selectedAsset) {
        return ProtocolAdapterFactory
          .getAdapter(PROTOCOLS.solana)
          .getDefaultCoin(marketData.value!, +balance.value);
      }
      return undefined;
    }
    const {
      formModel,
      errors,
      hasError,
      invoiceId,
      invoiceContract,
      scanTransferQrCode,
      handleAssetChange,
    } = useTransferSendForm({ transferData: props.transferData, getSelectedAssetValue });
    const recipientsCount = computed(() => formModel.value.addresses?.length || 1);
    const recipientsRef = computed(() => formModel.value.addresses || []);
    const selectedAssetContractId = computed(
      () => formModel.value.selectedAsset?.contractId as (string | undefined),
    );
    const {
      fee,
      maxFee,
      feeList,
      feeSelectedIndex,
      updateFeeList,
    } = useSolFeeCalculation(recipientsCount, activeAccount.value?.address, {
      recipients: recipientsRef,
      selectedAssetContractId,
    });

    const shouldUseMaxAmount = ref(false);

    const { max } = useSolMaxAmount(formModel);

    const numericFee = computed(() => +fee.value.toFixed());
    const numericMaxFee = computed(() => +maxFee.value.toFixed());

    const recipientPlaceholderText = t(
      'modals.send.recipientPlaceholderProtocol',
      {
        name: PROTOCOLS.solana,
      },
    ) as string;

    function emitCurrentFormModelState() {
      const inputPayload: TransferFormModel = {
        ...formModel.value,
        fee: fee.value as BigNumber,
        total: numericFee.value + +(formModel.value?.amount || 0) * recipientsCount.value,
        invoiceId: invoiceId.value,
        invoiceContract: invoiceContract.value,
      };
      emit('update:transferData', inputPayload);
      return nextTick();
    }

    // Method called from a parent scope - avoid changing its name.
    async function submit() {
      if (!hasError.value) {
        await emitCurrentFormModelState();
        emit('success');
      }
    }

    function toggleMaxAmount() {
      shouldUseMaxAmount.value = !shouldUseMaxAmount.value;
      if (shouldUseMaxAmount.value) {
        formModel.value.amount = max.value;
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async function getTransferGasLimit() { return undefined; }

    let polling: NodeJS.Timeout | null = null;

    onMounted(() => {
      polling = executeAndSetInterval(async () => {
        updateFeeList();
      }, 5000);
    });

    onUnmounted(() => {
      if (polling) {
        clearInterval(polling);
      }
    });

    watch(
      () => [formModel.value.selectedAsset, formModel.value.addresses],
      async () => {
        updateFeeList();
      },
      { deep: true },
    );

    watch(
      max,
      (newMax) => {
        if (shouldUseMaxAmount.value) {
          formModel.value.amount = newMax;
        }
      },
    );

    watch(
      hasError,
      (val) => emit('error', val),
      { deep: true },
    );

    watch(
      formModel,
      () => {
        emitCurrentFormModelState();
      },
      { deep: true },
    );

    return {
      SOL_PROTOCOL_NAME,
      SOL_COIN_SYMBOL,
      PROTOCOLS,
      NETWORK_TYPE_TESTNET,
      formModel,
      activeNetwork,
      maxFee,
      feeList,
      recipientPlaceholderText,
      feeSelectedIndex,
      numericFee,
      numericMaxFee,
      errors,
      balance,
      max,
      recipientsCount,
      shouldUseMaxAmount,
      scanTransferQrCode,
      handleAssetChange,
      submit,
      toggleMaxAmount,
    };
  },
});
</script>
