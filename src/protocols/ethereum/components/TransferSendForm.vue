<template>
  <TransferSendFormBase
    v-bind="$attrs"
    :transfer-data="transferData"
    :fee="numericFee"
    :max-fee="numericMaxFee"
    :fee-symbol="coinSymbol"
    :protocol="protocol"
    :custom-title="$t('modals.send.sendAsset', { name: protocolName })"
    class="transfer-send-form"
  >
    <template #recipient>
      <TransferSendRecipient
        v-model="formModel.addresses"
        :max-recipients="10"
        :placeholder="recipientPlaceholderText"
        :errors="errors"
        :protocol="protocol"
        :validation-rules="{ account_address: [protocol] }"
        @openQrModal="scanTransferQrCode()"
      />
    </template>

    <template #amount>
      <TransferSendAmount
        v-model="formModel.amount"
        :errors="errors"
        :selected-asset="formModel.selectedAsset"
        :protocol="protocol"
        :blink-on-change="shouldUseMaxAmount"
        :validation-rules="{
          ...+balance.minus(maxFee) > 0
            ? { max_value: max }
            : {},
          enough_coin: [maxFee.toString(), coinSymbol],
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
import BigNumber from 'bignumber.js';

import type {
  AssetContractId,
  IAsset,
  Protocol,
  TransferFormModel,
} from '@/types';
import {
  useAccountAssetsList,
  useBalances,
  useCurrencies,
  useNetworks,
  useAccounts,
} from '@/composables';
import { useEthFeeCalculation } from '@/protocols/ethereum/composables/ethFeeCalculation';
import { useTransferSendForm } from '@/composables/transferSendForm';
import { useCoinMaxAmount } from '@/composables/coinMaxAmount';
import { NETWORK_TYPE_TESTNET, PROTOCOLS } from '@/constants';
import { executeAndSetInterval } from '@/utils';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';
import {
  ETH_COIN_PRECISION,
  ETH_COIN_SYMBOL,
  ETH_PROTOCOL_NAME,
} from '@/protocols/ethereum/config';
import { useEthNetworkSettings } from '@/protocols/ethereum/composables/ethNetworkSettings';
import { getTokenTransferGasLimit } from '@/protocols/ethereum/helpers';

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
    protocol: { type: String as PropType<Protocol>, required: true },
  },
  emits: [
    'update:transferData',
    'success',
    'error',
  ],
  setup(props, { emit }) {
    const adapter = computed(() => ProtocolAdapterFactory.getAdapter(props.protocol));
    const protocolName = computed(() => adapter.value.protocolName);
    const coinSymbol = computed(() => adapter.value.coinSymbol);

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
          .getAdapter(props.protocol)
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
    } = useTransferSendForm({
      transferData: props.transferData,
      getSelectedAssetValue,
    });
    const recipientsCount = computed(() => formModel.value.addresses?.length || 1);
    const {
      fee,
      maxFee,
      feeList,
      feeSelectedIndex,
      maxFeePerGas,
      maxPriorityFeePerGas,
      updateFeeList,
    } = useEthFeeCalculation(props.protocol, recipientsCount);
    const { ethActiveNetworkSettings } = useEthNetworkSettings();

    const shouldUseMaxAmount = ref(false);

    const { max } = useCoinMaxAmount({ formModel, fee: maxFee });

    const numericFee = computed(() => +fee.value.toFixed());
    const numericMaxFee = computed(() => +maxFee.value.toFixed());

    const recipientPlaceholderText = `${t('modals.send.recipientPlaceholderProtocol', { name: props.protocol })}`;

    function emitCurrentFormModelState() {
      const inputPayload: TransferFormModel = {
        ...formModel.value,
        fee: fee.value as BigNumber,
        maxFeePerGas: maxFeePerGas.value?.toFormat(ETH_COIN_PRECISION),
        maxPriorityFeePerGas: maxPriorityFeePerGas.value?.toFormat(ETH_COIN_PRECISION),
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

    async function getTransferGasLimit() {
      const amount = new BigNumber(formModel.value.amount!);
      if (
        props.transferData.selectedAsset?.contractId !== 'ethereum'
        && props.transferData.selectedAsset?.contractId !== 'bnb'
        && amount.gt(0)
        && formModel.value.addresses?.length
      ) {
        const { nodeUrl } = ethActiveNetworkSettings.value;

        const results = await Promise.all(
          formModel.value.addresses.map((address) => getTokenTransferGasLimit(
            formModel.value.selectedAsset?.contractId!,
            address,
            activeAccount.value?.address,
            amount,
            nodeUrl,
          )),
        );

        const total = results.reduce((sum, value) => sum + value, 0);
        return total;
      }
      return undefined;
    }

    let polling: NodeJS.Timeout | null = null;

    onMounted(() => {
      polling = executeAndSetInterval(async () => {
        updateFeeList(await getTransferGasLimit());
      }, 5000);
    });

    onUnmounted(() => {
      if (polling) {
        clearInterval(polling);
      }
    });

    watch(
      () => formModel.value.selectedAsset,
      async () => {
        updateFeeList(await getTransferGasLimit());
      },
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
      protocolName,
      coinSymbol,
      ETH_PROTOCOL_NAME,
      ETH_COIN_SYMBOL,
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
