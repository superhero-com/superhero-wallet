<template>
  <TransferSendFormBase
    v-bind="$attrs"
    :transfer-data="transferData"
    :fee="numericFee"
    :fee-symbol="ETH_SYMBOL"
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
        :validation-rules="{
          ...+balance.minus(fee) > 0
            ? { max_value: max.toString() }
            : {},
          enough_coin: [fee.toString(), ETH_SYMBOL],
        }"
        readonly
        @asset-selected="handleAssetChange"
      >
        <template #label-after>
          <BtnMaxAmount
            :is-max="formModel?.amount?.toString() === max.toString()"
            @click="setMaxAmount"
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

import type { TransferFormModel } from '@/types';
import {
  useBalances,
  useNetworks,
} from '@/composables';
import { useEthBaseFee } from '@/protocols/ethereum/composables/ethBaseFee';
import { useTransferSendForm } from '@/composables/transferSendForm';
import { NETWORK_TYPE_TESTNET, PROTOCOLS } from '@/constants';
import {
  executeAndSetInterval,
} from '@/utils';
import {
  ETH_COIN_NAME,
  ETH_COIN_PRECISION,
  ETH_GAS_LIMIT,
  ETH_SYMBOL,
} from '@/protocols/ethereum/config';
import { etherFromGwei } from '@/protocols/ethereum/helpers';

import DetailsItem from '@/popup/components/DetailsItem.vue';
import TransferSendFormBase from '@/popup/components/TransferSendFormBase.vue';
import TransferSendRecipient from '@/popup/components/TransferSend/TransferSendRecipient.vue';
import TransferSendAmount from '@/popup/components/TransferSend/TransferSendAmount.vue';
import TransactionSpeedPicker, { FeeItem } from '@/popup/components/TransactionSpeedPicker.vue';
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
      protocol: PROTOCOLS.ethereum,
    });

    const isTestnet = activeNetwork.value.type === NETWORK_TYPE_TESTNET;

    const feeSelectedIndex = ref(1);

    // total fee
    const feeSlow = ref(new BigNumber(0.00000002));
    const feeMedium = ref(new BigNumber(0.00000002));
    const feeHigh = ref(new BigNumber(0.00000002));

    // max priority fee per gas
    const maxPriorityFeePerGasSlow = ref(etherFromGwei(isTestnet ? 0.000001 : 0.1));
    const maxPriorityFeePerGasMedium = ref(etherFromGwei(isTestnet ? 0.000001 : 0.15));
    const maxPriorityFeePerGasFast = ref(etherFromGwei(isTestnet ? 0.000001 : 0.2));

    // maximum fee per gas that will be paid
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
    const maxFeePerGas = computed(() => feeList.value[feeSelectedIndex.value].maxFeePerGas);
    const maxPriorityFeePerGas = computed(
      () => feeList.value[feeSelectedIndex.value].maxPriorityFee,
    );
    const numericFee = computed(() => +fee.value.toFixed());
    const max = computed(() => balance.value.minus(fee.value));

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

    function setMaxAmount() {
      formModel.value.amount = max.value.isPositive() ? max.value.toString() : '0';
    }

    async function updateFeeList() {
      const baseFee = new BigNumber(await getBaseFee());

      maxFeePerGasSlow.value = baseFee.multipliedBy(2).plus(maxPriorityFeePerGasSlow.value);
      maxFeePerGasMedium.value = baseFee.multipliedBy(2).plus(maxPriorityFeePerGasMedium.value);
      maxFeePerGasHigh.value = baseFee.multipliedBy(2).plus(maxPriorityFeePerGasFast.value);

      feeSlow.value = baseFee.plus(maxPriorityFeePerGasSlow.value).multipliedBy(ETH_GAS_LIMIT);
      feeMedium.value = baseFee.plus(maxPriorityFeePerGasMedium.value).multipliedBy(ETH_GAS_LIMIT);
      feeHigh.value = baseFee.plus(maxPriorityFeePerGasFast.value).multipliedBy(ETH_GAS_LIMIT);
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
      openScanQrModal,
      handleAssetChange,
      submit,
      setMaxAmount,
    };
  },
});
</script>
