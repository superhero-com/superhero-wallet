<template>
  <TransferSendFormBase
    v-bind="$attrs"
    :transfer-data="transferData"
    :fee="numericFee"
    :fee-symbol="DOGE_SYMBOL"
    :protocol="PROTOCOLS.dogecoin"
    :custom-title="$t('modals.send.sendAsset', { name: DOGE_PROTOCOL_NAME })"
    class="transfer-send-form"
  >
    <template #recipient>
      <TransferSendRecipient
        v-model="formModel.addresses"
        :max-recipients="10"
        :placeholder="$t('modals.send.recipientPlaceholderProtocol', { name: PROTOCOLS.dogecoin })"
        :errors="errors"
        :protocol="PROTOCOLS.dogecoin"
        :validation-rules="{ account_address: [PROTOCOLS.dogecoin, activeNetwork.type] }"
        @openQrModal="scanTransferQrCode()"
      />
    </template>

    <template #amount>
      <TransferSendAmount
        v-model="formModel.amount"
        :errors="errors"
        :selected-asset="formModel.selectedAsset"
        readonly
        :protocol="PROTOCOLS.dogecoin"
        :validation-rules="{
          ...+balance.minus(fee) > 0
            ? { max_value: max.toString() }
            : {},
          enough_coin: [fee.toString(), DOGE_SYMBOL],
        }"
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
  PropType,
  ref,
  watch,
} from 'vue';
import { useI18n } from 'vue-i18n';
import BigNumber from 'bignumber.js';
import type { IFeeItem, TransferFormModel } from '@/types';
import { useAccounts, useBalances, useNetworks } from '@/composables';
import { useTransferSendForm } from '@/composables/transferSendForm';
import { useCoinMaxAmount } from '@/composables/coinMaxAmount';
import { NETWORK_TYPE_TESTNET, PROTOCOLS } from '@/constants';
import { DOGE_PROTOCOL_NAME, DOGE_SYMBOL } from '@/protocols/dogecoin/config';

import TransferSendFormBase from '@/popup/components/TransferSendFormBase.vue';
import TransferSendRecipient from '@/popup/components/TransferSend/TransferSendRecipient.vue';
import TransferSendAmount from '@/popup/components/TransferSend/TransferSendAmount.vue';
import DetailsItem from '@/popup/components/DetailsItem.vue';
import TransactionSpeedPicker from '@/popup/components/TransactionSpeedPicker.vue';
import BtnMaxAmount from '@/popup/components/buttons/BtnMaxAmount.vue';

export default defineComponent({
  name: 'DogeTransferSendForm',
  components: {
    BtnMaxAmount,
    TransactionSpeedPicker,
    DetailsItem,
    TransferSendAmount,
    TransferSendRecipient,
    TransferSendFormBase,
  },
  model: { prop: 'transferData' },
  props: { transferData: { type: Object as PropType<TransferFormModel>, required: true } },
  emits: ['update:transferData', 'success', 'error'],
  setup(props, { emit }) {
    const { t } = useI18n();
    const { balance } = useBalances();
    const { activeNetwork } = useNetworks();
    const { activeAccount } = useAccounts();

    const {
      formModel,
      errors,
      hasError,
      invoiceId,
      invoiceContract,
      handleAssetChange,
      scanTransferQrCode,
    } = useTransferSendForm({ transferData: props.transferData });

    const feeSelectedIndex = ref(0); // slow by default
    const feeSlow = ref(new BigNumber(0.01));
    const feeMedium = ref(new BigNumber(0.05));
    const feeHigh = ref(new BigNumber(0.1));
    const recipientsCount = computed(() => (
      formModel.value?.addresses?.length || 1));

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

    const shouldUseMaxAmount = ref(false);

    function toggleMaxAmount() {
      shouldUseMaxAmount.value = !shouldUseMaxAmount.value;
      if (shouldUseMaxAmount.value) {
        formModel.value.amount = max.value;
      }
    }

    function emitCurrentFormModelState() {
      const inputPayload = {
        ...formModel.value,
        fee: fee.value as BigNumber,
        total: numericFee.value + +(formModel.value?.amount || 0),
        invoiceId: invoiceId.value,
        invoiceContract: invoiceContract.value,
      } as TransferFormModel;
      emit('update:transferData', inputPayload);
      return nextTick();
    }

    async function submit() {
      if (!hasError.value) {
        await emitCurrentFormModelState();
        emit('success');
      }
    }

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

    watch(
      max,
      (newMax) => {
        if (shouldUseMaxAmount.value) {
          formModel.value.amount = newMax;
        }
      },
    );

    return {
      DOGE_PROTOCOL_NAME,
      DOGE_SYMBOL,
      PROTOCOLS,
      NETWORK_TYPE_TESTNET,
      activeNetwork,
      fee,
      feeList,
      feeSelectedIndex,
      numericFee,
      max,
      balance,
      activeAccount,
      formModel,
      errors,
      hasError,
      shouldUseMaxAmount,
      toggleMaxAmount,
      handleAssetChange,
      scanTransferQrCode,
      submit,
    };
  },
});
</script>
