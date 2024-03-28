<template>
  <TransferSendFormBase
    v-bind="$attrs"
    :transfer-data="transferData"
    :fee="numericFee"
    :fee-symbol="ETH_COIN_SYMBOL"
    :protocol="PROTOCOLS.ethereum"
    :custom-title="$t('modals.send.sendAsset', { name: ETH_COIN_NAME })"
    class="transfer-send-form"
  >
    <template #recipient>
      <TransferSendRecipient
        v-model.trim="formModel.address"
        :placeholder="recipientPlaceholderText"
        :errors="errors"
        :protocol="PROTOCOLS.ethereum"
        :validation-rules="{ account_address: [PROTOCOLS.ethereum] }"
        @openQrModal="openScanQrModal"
      />
    </template>

    <template #amount>
      <TransferSendAmount
        v-model="formModel.amount"
        :errors="errors"
        :selected-asset="formModel.selectedAsset"
        :protocol="PROTOCOLS.ethereum"
        :blink-on-change="shouldUseMaxAmount"
        :validation-rules="{
          ...+balance.minus(fee) > 0
            ? { max_value: max }
            : {},
          enough_coin: [fee.toString(), ETH_COIN_SYMBOL],
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
        :label="$t('modals.send.transactionSpeed')"
      >
        <template #value>
          <TransactionSpeedPicker
            v-model="feeSelectedIndex"
            :fee-list="feeList"
          />
        </template>
      </DetailsItem>
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
import { useRoute } from 'vue-router';
import BigNumber from 'bignumber.js';

import type { AssetContractId, IAsset, TransferFormModel } from '@/types';
import {
  useAccountAssetsList,
  useBalances,
  useCurrencies,
  useNetworks,
} from '@/composables';
import { useEthFeeCalculation } from '@/protocols/ethereum/composables/ethFeeCalculation';
import { useTransferSendForm } from '@/composables/transferSendForm';
import { NETWORK_TYPE_TESTNET, PROTOCOLS } from '@/constants';
import { executeAndSetInterval } from '@/utils';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';
import {
  ETH_COIN_NAME,
  ETH_COIN_PRECISION,
  ETH_COIN_SYMBOL,
  ETH_GAS_LIMIT,
} from '@/protocols/ethereum/config';
import { useEthMaxAmount } from '@/protocols/ethereum/composables/ethMaxAmount';

import DetailsItem from '@/popup/components/DetailsItem.vue';
import TransferSendFormBase from '@/popup/components/TransferSendFormBase.vue';
import TransferSendRecipient from '@/popup/components/TransferSend/TransferSendRecipient.vue';
import TransferSendAmount from '@/popup/components/TransferSend/TransferSendAmount.vue';
import TransactionSpeedPicker from '@/popup/components/TransactionSpeedPicker.vue';
import BtnMaxAmount from '@/popup/components/buttons/BtnMaxAmount.vue';

export default defineComponent({
  name: 'EthTransferSendForm',
  components: {
    BtnMaxAmount,
    TransactionSpeedPicker,
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
    const route = useRoute();
    const { t } = useI18n();
    const { activeNetwork } = useNetworks();
    const { marketData } = useCurrencies();
    const { balance } = useBalances();
    const {
      fee,
      feeList,
      feeSelectedIndex,
      maxFeePerGas,
      maxPriorityFeePerGas,
      updateFeeList,
    } = useEthFeeCalculation();
    const { accountAssets } = useAccountAssetsList();

    function getSelectedAssetValue(assetContractId?: AssetContractId, selectedAsset?: IAsset) {
      if (assetContractId) {
        return accountAssets.value.find(({ contractId }) => contractId === assetContractId);
      } if (!selectedAsset) {
        return ProtocolAdapterFactory
          .getAdapter(PROTOCOLS.ethereum)
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
      openScanQrModal,
      handleAssetChange,
      updateFormModelValues,
    } = useTransferSendForm({
      transferData: props.transferData,
      getSelectedAssetValue,
    });

    const shouldUseMaxAmount = ref(false);

    const maxFee = computed(() => maxFeePerGas.value!.multipliedBy(ETH_GAS_LIMIT));

    const { max } = useEthMaxAmount({ formModel, fee: maxFee });

    const numericFee = computed(() => +fee.value.toFixed());

    const recipientPlaceholderText = `${t('modals.send.recipientPlaceholderProtocol', { name: PROTOCOLS.ethereum })} ${t('modals.send.recipientPlaceholderENS')}`;

    function emitCurrentFormModelState() {
      const inputPayload: TransferFormModel = {
        ...formModel.value,
        fee: fee.value as BigNumber,
        maxFeePerGas: maxFeePerGas.value?.toFormat(ETH_COIN_PRECISION),
        maxPriorityFeePerGas: maxPriorityFeePerGas.value?.toFormat(ETH_COIN_PRECISION),
        total: numericFee.value + +(formModel.value?.amount || 0),
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

    let polling: NodeJS.Timer | null = null;

    onMounted(() => {
      polling = executeAndSetInterval(() => {
        updateFeeList();
      }, 5000);

      const { query } = route;
      updateFormModelValues({
        ...query,
        token: query.token || props.transferData.selectedAsset?.contractId,
      });
    });

    onUnmounted(() => {
      if (polling) {
        clearInterval(polling);
      }
    });

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
      ETH_COIN_NAME,
      ETH_COIN_SYMBOL,
      PROTOCOLS,
      NETWORK_TYPE_TESTNET,
      formModel,
      activeNetwork,
      fee,
      feeList,
      recipientPlaceholderText,
      feeSelectedIndex,
      numericFee,
      errors,
      balance,
      max,
      shouldUseMaxAmount,
      openScanQrModal,
      handleAssetChange,
      submit,
      toggleMaxAmount,
    };
  },
});
</script>
