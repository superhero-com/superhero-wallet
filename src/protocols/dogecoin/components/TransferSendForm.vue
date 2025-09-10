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
  onMounted,
  onUnmounted,
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
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';
import { fetchJson, executeAndSetInterval } from '@/utils';

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
    const dogeAdapter = ProtocolAdapterFactory.getAdapter(PROTOCOLS.dogecoin);

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
    // Initial safe defaults; will be updated dynamically
    const feeSlow = ref(new BigNumber(0.02));
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

    async function updateFeeList() {
      try {
        const byteSize = (await dogeAdapter.constructAndSignTx(
          0,
          formModel.value.addresses?.[0] || activeAccount.value.address,
          {
            fee: 0,
            ...activeAccount.value,
          },
        )).virtualSize();

        const { nodeUrl } = (activeNetwork.value.protocols as any)[PROTOCOLS.dogecoin] as any;

        // Try Electrs-compatible fee estimates; fallback to 1 DOGE/kB baseline
        let perByteKoinu: number | undefined;
        try {
          const estimates = await fetchJson(`${nodeUrl}/fee-estimates`);
          perByteKoinu = Number(estimates?.['5'] || estimates?.['6'] || estimates?.['7'] || estimates?.['8']);
        } catch (_e) { /* ignore; fallback below */ }

        // 1 DOGE per kB => 100000 koinu/vB (1e8 / 1000)
        const FALLBACK_PER_BYTE_KOINU = 100000; // medium
        const baseRate = Number.isFinite(perByteKoinu) && perByteKoinu! > 0
          ? perByteKoinu!
          : FALLBACK_PER_BYTE_KOINU;

        const feeStepFactor = new BigNumber(0.5);
        const mediumKoinuTotal = new BigNumber(Math.ceil(baseRate * byteSize));

        const toDoge = (koinu: BigNumber) => koinu.dividedBy(1e8);

        feeSlow.value = toDoge(new BigNumber(
          Math.ceil(mediumKoinuTotal.minus(mediumKoinuTotal.times(feeStepFactor)).toNumber()),
        ));

        feeMedium.value = toDoge(new BigNumber(
          Math.ceil(mediumKoinuTotal.toNumber()),
        ));

        feeHigh.value = toDoge(new BigNumber(
          Math.ceil(mediumKoinuTotal.plus(mediumKoinuTotal.times(feeStepFactor)).toNumber()),
        ));
      } catch (_error) {
        // Keep defaults on failure
      }
    }

    let polling: NodeJS.Timeout | null = null;

    onMounted(() => {
      polling = executeAndSetInterval(() => { updateFeeList(); }, 5000);
    });

    onUnmounted(() => { if (polling) { clearInterval(polling); } });

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
