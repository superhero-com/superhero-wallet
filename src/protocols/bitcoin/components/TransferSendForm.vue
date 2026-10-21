<template>
  <TransferSendFormBase
    v-bind="$attrs"
    :transfer-data="transferData"
    :fee="numericFee"
    :fee-symbol="coinSymbol"
    :protocol="protocol"
    class="transfer-send-form"
  >
    <template #recipient>
      <TransferSendRecipient
        v-model="formModel.addresses"
        :max-recipients="10"
        :placeholder="recipientPlaceholderText"
        :errors="errors"
        :protocol="protocol"
        :validation-rules="{
          account_address: [protocol, activeNetwork.type],
        }"
        @openQrModal="scanTransferQrCode()"
      />
    </template>

    <template #amount>
      <TransferSendAmount
        v-model="formModel.amount"
        :errors="errors"
        :selected-asset="formModel.selectedAsset"
        readonly
        :protocol="protocol"
        :validation-rules="{
          ...+balance.minus(fee) > 0
            ? { max_value: max.toString() }
            : {},
          enough_coin: [fee.toString(), coinSymbol],
          ...activeNetwork.type !== NETWORK_TYPE_TESTNET && protocol === PROTOCOLS.bitcoin
            ? { min_value: toBitcoin(DUST_AMOUNT) }
            : {},
          ...protocol === PROTOCOLS.dogecoin
            ? { min_value: toBitcoin(DOGE_DUST_AMOUNT) }
            : {},
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
import { debounce } from 'lodash-es';
import { useI18n } from 'vue-i18n';
import BigNumber from 'bignumber.js';
import { toBitcoin } from 'satoshi-bitcoin';

import type { IFeeItem, TransferFormModel } from '@/types';
import {
  useAccounts,
  useBalances,
  useNetworks,
} from '@/composables';
import { useTransferSendForm } from '@/composables/transferSendForm';
import { useCoinMaxAmount } from '@/composables/coinMaxAmount';
import { NETWORK_TYPE_TESTNET, PROTOCOLS } from '@/constants';
import {
  executeAndSetInterval,
  fetchJson,
} from '@/utils';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';
import Logger from '@/lib/logger';
import { DUST_AMOUNT } from '@/protocols/bitcoin/config';
import {
  DOGE_DEFAULT_FEE,
  DOGE_DEFAULT_FEE_RATE,
  DOGE_DUST_AMOUNT,
} from '@/protocols/dogecoin/config';
import type { BitcoinAdapter } from '@/protocols/bitcoin/libs/BitcoinAdapter';
import type { DogecoinAdapter } from '@/protocols/dogecoin/libs/DogecoinAdapter';

import { INFO_BOX_TYPES } from '@/popup/components/InfoBox.vue';
import DetailsItem from '@/popup/components/DetailsItem.vue';
import TransferSendFormBase from '@/popup/components/TransferSendFormBase.vue';
import TransferSendRecipient from '@/popup/components/TransferSend/TransferSendRecipient.vue';
import TransferSendAmount from '@/popup/components/TransferSend/TransferSendAmount.vue';
import TransactionSpeedPicker from '@/popup/components/TransactionSpeedPicker.vue';
import BtnMaxAmount from '@/popup/components/buttons/BtnMaxAmount.vue';

export default defineComponent({
  name: 'BtcTransferSendForm',
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
    protocol: { type: String as PropType<keyof typeof PROTOCOLS>, default: PROTOCOLS.bitcoin },
  },
  emits: [
    'update:transferData',
    'success',
    'error',
  ],
  setup(props, { emit }) {
    const bitcoinAdapter = ProtocolAdapterFactory.getAdapter(props.protocol);

    const { t } = useI18n();
    const { activeNetwork } = useNetworks();
    const { balance } = useBalances();
    const { activeAccount } = useAccounts();

    const hasMultisigTokenWarning = ref(false);
    const isUrlTippingEnabled = ref(false);
    const shouldUseMaxAmount = ref(false);

    const {
      formModel,
      errors,
      hasError,
      invoiceId,
      invoiceContract,
      clearPayload,
      handleAssetChange,
      scanTransferQrCode,
    } = useTransferSendForm({
      transferData: props.transferData,
    });

    const recipientPlaceholderText = t('modals.send.recipientPlaceholderProtocol', { name: props.protocol });

    const isDogecoin = props.protocol === PROTOCOLS.dogecoin;
    const defaultFee = isDogecoin ? DOGE_DEFAULT_FEE : 0.00002;

    const feeSelectedIndex = ref(1);
    const feeSlow = ref(new BigNumber(defaultFee));
    const feeMedium = ref(new BigNumber(defaultFee));
    const feeHigh = ref(new BigNumber(defaultFee));
    const recipientsCount = computed(() => formModel.value.addresses?.length || 1);

    const feeList = computed((): IFeeItem[] => [
      { fee: feeSlow.value, time: 3540, label: t('common.transferSpeed.slow') },
      { fee: feeMedium.value, time: 600, label: t('common.transferSpeed.medium') },
      { fee: feeHigh.value, time: 25, label: t('common.transferSpeed.fast') },
    ]);
    const fee = computed(() => (
      feeList.value[feeSelectedIndex.value].fee.multipliedBy(recipientsCount.value)
    ));

    const numericFee = computed(() => +fee.value.toFixed());

    const { max } = useCoinMaxAmount({ formModel, fee });

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

    async function getTransactionVsizes(feeRates: number[]): Promise<number[]> {
      // Max spends every input, so the fee doesn't move its size. A later send to
      // another recipient can have change.
      return (bitcoinAdapter as BitcoinAdapter | DogecoinAdapter).estimateVsize(
        Number(formModel.value.amount) || 0,
        formModel.value.addresses?.[0] || activeAccount.value.address,
        feeRates,
        {
          address: activeAccount.value.address,
          sweep: shouldUseMaxAmount.value,
          withChange: recipientsCount.value > 1,
        },
      );
    }

    let feeUpdateRun = 0;
    let appliedFeeUpdateRun = 0;

    async function updateFeeList() {
      feeUpdateRun += 1;
      const run = feeUpdateRun;
      try {
        const { nodeUrl } = (activeNetwork.value.protocols as any)[props.protocol];

        let feeRate: number | undefined;
        try {
          const estimates = await fetchJson(`${nodeUrl}/fee-estimates`);
          // Prefer ~5-block target; fallback to 3/6/2 if missing
          feeRate = estimates?.['5'] || estimates?.['6'] || estimates?.['7'] || estimates?.['8'];
        } catch (_e) { /* ignore; fallback below */ }

        // Sane defaults if API fails: medium 15 sat/vB, or 0.01 DOGE/kB for Dogecoin
        const DEFAULT_RATE_SAT_PER_VB = isDogecoin ? DOGE_DEFAULT_FEE_RATE : 15;
        const baseRate = (
          Number.isFinite(feeRate) && feeRate! > 0
        ) ? feeRate! : DEFAULT_RATE_SAT_PER_VB;
        // Slow, medium and fast. Double the medium for the testnet to match relay fee.
        // TODO: Revisit this along with fee calculation
        const feeRates = [0.5, activeNetwork.value.type === NETWORK_TYPE_TESTNET ? 2 : 1, 1.5]
          // Dogecoin miners leave out transactions under 0.01 DOGE/kB by default.
          .map((factor) => Math.max(factor * baseRate, isDogecoin ? DOGE_DEFAULT_FEE_RATE : 0));
        // Each speed is sized at its own rate, as a higher fee can take another input.
        const vsizes = await getTransactionVsizes(feeRates);
        // Drop this result if a newer run was already applied.
        if (run < appliedFeeUpdateRun) return;
        appliedFeeUpdateRun = run;

        [feeSlow.value, feeMedium.value, feeHigh.value] = feeRates.map((rate, idx) => (
          new BigNumber(toBitcoin(Math.ceil(rate * vsizes[idx])))
        ));
      } catch (error: any) {
        Logger.write(error);
      }
    }

    let polling: NodeJS.Timeout | null = null;

    onMounted(() => {
      polling = executeAndSetInterval(() => {
        updateFeeList();
      }, 5000);
    });

    const updateFeeListDebounced = debounce(updateFeeList, 300);

    watch([() => formModel.value.amount, recipientsCount], () => updateFeeListDebounced());

    onUnmounted(() => {
      updateFeeListDebounced.cancel();
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
      INFO_BOX_TYPES,
      coinSymbol: ProtocolAdapterFactory.getAdapter(props.protocol).coinSymbol,
      DUST_AMOUNT,
      DOGE_DUST_AMOUNT,
      PROTOCOLS,
      NETWORK_TYPE_TESTNET,
      hasMultisigTokenWarning,
      formModel,
      isUrlTippingEnabled,
      activeNetwork,
      fee,
      feeList,
      feeSelectedIndex,
      numericFee,
      activeAccount,
      recipientPlaceholderText,
      errors,
      balance,
      max,
      clearPayload,
      shouldUseMaxAmount,
      scanTransferQrCode,
      handleAssetChange,
      submit,
      toggleMaxAmount,
      toBitcoin,
    };
  },
});
</script>
