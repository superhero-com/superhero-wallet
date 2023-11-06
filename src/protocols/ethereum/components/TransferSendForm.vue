<template>
  <TransferSendFormBase
    v-bind="$attrs"
    :transfer-data="transferData"
    :fee="numericFee"
    :fee-symbol="ETH_SYMBOL"
    :protocol="PROTOCOL_ETHEREUM"
    :custom-title="$t('modals.send.sendAsset', { name: ETH_COIN_NAME })"
    class="transfer-send-form"
  >
    <template #recipient>
      <TransferSendRecipient
        v-model.trim="formModel.address"
        :placeholder="recipientPlaceholderText"
        :errors="errors"
        :protocol="PROTOCOL_ETHEREUM"
        :validation-rules="{ address_eth: true }"
        @openQrModal="openScanQrModal"
      />
    </template>

    <template #amount>
      <TransferSendAmount
        v-model="formModel.amount"
        :errors="errors"
        :selected-asset="formModel.selectedAsset"
        readonly
        :protocol="PROTOCOL_ETHEREUM"
        :validation-rules="{
          ...+balance.minus(fee) > 0
            ? { max_value: max.toString() }
            : {},
          enough_coin: [fee.toString(), ETH_SYMBOL],
        }"
        @asset-selected="handleAssetChange"
      >
        <template #label-after>
          <BtnPlain
            class="max-button"
            :class="{ chosen: formModel?.amount?.toString() === max.toString() }"
            @click="setMaxAmount"
          >
            {{ $t('common.max') }}
          </BtnPlain>
        </template>
      </TransferSendAmount>
    </template>

    <template
      #extra
    >
      <div
        v-show="activeNetwork.type !== NETWORK_TYPE_TESTNET"
      >
        <DetailsItem
          :label="$t('modals.send.transactionSpeed')"
        >
          <template #value>
            <TransactionSpeedPicker
              v-model="feeSelectedIndex"
              :fee-list="feeList"
            />
          </template>
        </DetailsItem>
      </div>
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

import type { TransferFormModel } from '@/types';
import {
  useBalances,
  useNetworks,
} from '@/composables';
import { useEthBaseFee } from '@/protocols/ethereum/composables/ethBaseFee';
import { useTransferSendForm } from '@/composables/transferSendForm';
import { NETWORK_TYPE_TESTNET, PROTOCOL_ETHEREUM } from '@/constants';
import {
  executeAndSetInterval,
} from '@/utils';
import {
  ETH_COIN_NAME,
  ETH_SYMBOL,
} from '@/protocols/ethereum/config';
import { etherFromGwei } from '@/protocols/ethereum/helpers';

import DetailsItem from '@/popup/components/DetailsItem.vue';
import TransferSendFormBase from '@/popup/components/TransferSendFormBase.vue';
import TransferSendRecipient from '@/popup/components/TransferSend/TransferSendRecipient.vue';
import TransferSendAmount from '@/popup/components/TransferSend/TransferSendAmount.vue';
import TransactionSpeedPicker, { FeeItem } from '@/popup/components/TransactionSpeedPicker.vue';
import BtnPlain from '@/popup/components/buttons/BtnPlain.vue';

export default defineComponent({
  name: 'EthTransferSendForm',
  components: {
    BtnPlain,
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
    const { balance } = useBalances();
    const { getBaseFee } = useEthBaseFee();

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
      protocol: PROTOCOL_ETHEREUM,
    });

    const isTestnet = activeNetwork.value.type === NETWORK_TYPE_TESTNET;

    const feeSelectedIndex = ref(1);

    // total fee
    const feeSlow = ref(new BigNumber(0.00000002));
    const feeMedium = ref(new BigNumber(0.00000002));
    const feeHigh = ref(new BigNumber(0.00000002));

    // max priority fee
    const maxPriorityFeePerGasSlow = ref(etherFromGwei(isTestnet ? 0.000001 : 0.1));
    const maxPriorityFeePerGasMedium = ref(etherFromGwei(isTestnet ? 0.000001 : 0.15));
    const maxPriorityFeePerGasFast = ref(etherFromGwei(isTestnet ? 0.000001 : 0.2));

    // maximum fee that will be paid
    const maxFeePerGasSlow = ref(new BigNumber(0));
    const maxFeePerGasMedium = ref(new BigNumber(0));
    const maxFeePerGasHigh = ref(new BigNumber(0));

    // TODO - set correct time values
    const feeList = computed((): FeeItem[] => [
      {
        fee: feeSlow.value,
        time: 3540,
        label: t('common.transferSpeed.slow'),
        maxPriorityFee: maxPriorityFeePerGasSlow.value,
        maxFeePerGas: maxFeePerGasSlow.value,
      },
      {
        fee: feeMedium.value,
        time: 600,
        label: t('common.transferSpeed.medium'),
        maxPriorityFee: maxPriorityFeePerGasMedium.value,
        maxFeePerGas: maxFeePerGasMedium.value,
      },
      {
        fee: feeHigh.value,
        time: 25,
        label: t('common.transferSpeed.fast'),
        maxPriorityFee: maxPriorityFeePerGasFast.value,
        maxFeePerGas: maxFeePerGasHigh.value,
      },
    ]);

    const fee = computed(() => feeList.value[feeSelectedIndex.value].fee);
    const numericFee = computed(() => +fee.value.toFixed());
    const max = computed(() => balance.value.minus(fee.value));

    const recipientPlaceholderText = `${t('modals.send.recipientPlaceholderProtocol', { name: PROTOCOL_ETHEREUM })} ${t('modals.send.recipientPlaceholderENS')}`;

    function emitCurrentFormModelState() {
      const inputPayload: TransferFormModel = {
        ...formModel.value,
        fee: fee.value as BigNumber,
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

    function setMaxAmount() {
      formModel.value.amount = max.value.isPositive() ? max.value.toString() : '0';
    }

    async function updateFeeList() {
      const baseFee = new BigNumber(await getBaseFee());

      maxFeePerGasSlow.value = baseFee.multipliedBy(2).plus(maxPriorityFeePerGasSlow.value);
      maxFeePerGasMedium.value = baseFee.multipliedBy(2).plus(maxPriorityFeePerGasMedium.value);
      maxFeePerGasHigh.value = baseFee.multipliedBy(2).plus(maxPriorityFeePerGasFast.value);

      feeSlow.value = baseFee.plus(maxPriorityFeePerGasSlow.value);
      feeMedium.value = baseFee.plus(maxPriorityFeePerGasMedium.value);
      feeHigh.value = baseFee.plus(maxPriorityFeePerGasFast.value);
    }

    let polling: NodeJS.Timer | null = null;

    onMounted(() => {
      polling = executeAndSetInterval(() => {
        updateFeeList();
      }, 5000);

      const { query } = route;
      updateFormModelValues({
        ...query,
        token: query.token,
      });
    });

    onUnmounted(() => {
      if (polling) {
        clearInterval(polling);
      }
    });

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
      ETH_SYMBOL,
      PROTOCOL_ETHEREUM,
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
      openScanQrModal,
      handleAssetChange,
      submit,
      setMaxAmount,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';
@use '../../../styles/typography';

.transfer-send-form {
  .max-button {
    padding: 2px 8px;
    color: variables.$color-primary;

    @extend %face-sans-14-medium;

    line-height: 20px;
    border: 2px solid transparent;
    border-radius: 12px;

    &:hover {
      background: rgba(variables.$color-primary, 0.15);
    }

    &.chosen {
      background: rgba(variables.$color-primary, 0.15);
      border-color: rgba(variables.$color-primary, 0.5);
    }
  }
}
</style>
