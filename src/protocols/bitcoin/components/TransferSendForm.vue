<template>
  <TransferSendFormBase
    v-bind="$attrs"
    :transfer-data="transferData"
    :fee="numericFee"
    :fee-symbol="BTC_SYMBOL"
    :protocol="PROTOCOLS.bitcoin"
    :custom-title="$t('modals.send.sendAsset', { name: BTC_PROTOCOL_NAME })"
    class="transfer-send-form"
  >
    <template #recipient>
      <TransferSendRecipient
        v-model="formModel.addresses"
        :max-recipients="10"
        :placeholder="$t('modals.send.recipientPlaceholderProtocol', { name: PROTOCOLS.bitcoin })"
        :errors="errors"
        :protocol="PROTOCOLS.bitcoin"
        :validation-rules="{
          account_address: [PROTOCOLS.bitcoin, activeNetwork.type],
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
        :protocol="PROTOCOLS.bitcoin"
        :validation-rules="{
          ...+balance.minus(fee) > 0
            ? { max_value: max.toString() }
            : {},
          enough_coin: [fee.toString(), BTC_SYMBOL],
          ...activeNetwork.type === NETWORK_TYPE_TESTNET
            ? {}
            : { min_value_exclusive: toBitcoin(DUST_AMOUNT) },
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
import { useRoute } from 'vue-router';
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
import {
  BTC_PROTOCOL_NAME,
  BTC_SYMBOL,
  DUST_AMOUNT,
} from '@/protocols/bitcoin/config';

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
  },
  emits: [
    'update:transferData',
    'success',
    'error',
  ],
  setup(props, { emit }) {
    const bitcoinAdapter = ProtocolAdapterFactory.getAdapter(PROTOCOLS.bitcoin);

    const route = useRoute();
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
      updateFormModelValues,
    } = useTransferSendForm({
      transferData: props.transferData,
    });

    const feeSelectedIndex = ref(1);
    const feeSlow = ref(new BigNumber(0.00002));
    const feeMedium = ref(new BigNumber(0.00002));
    const feeHigh = ref(new BigNumber(0.00002));
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

    async function updateFeeList() {
      try {
        const byteSize = (await bitcoinAdapter.constructAndSignTx(
          // TODO: changed to 0 because balance.value can differs
          // from totalAmount from constructAndSignTx (balance is not being updated fast enough)
          // consider returning an actual amount in future
          0,
          formModel.value.addresses?.[0] || activeAccount.value.address,
          {
            fee: 0,
            ...activeAccount.value,
          },
        )).virtualSize();
        const { nodeUrl } = activeNetwork.value.protocols.bitcoin;

        const feeRate = (await fetchJson(`${nodeUrl}/fee-estimates`))['5'];
        const feeStepFactor = new BigNumber(0.5);
        const newFeeMedium = new BigNumber(Math.ceil(feeRate * byteSize));

        feeSlow.value = new BigNumber(
          toBitcoin(Math.ceil(newFeeMedium.minus(newFeeMedium.times(feeStepFactor)).toNumber())),
        );

        feeMedium.value = new BigNumber(
          toBitcoin(
            // Double the fee for the testnet to match relay fee.
            // TODO: Revisit this along with fee calculation
            newFeeMedium.toNumber() * (activeNetwork.value.type === NETWORK_TYPE_TESTNET ? 2 : 1),
          ),
        );

        feeHigh.value = new BigNumber(
          toBitcoin(Math.ceil(newFeeMedium.plus(newFeeMedium.times(feeStepFactor)).toNumber())),
        );
      } catch (error: any) {
        Logger.write(error);
      }
    }

    let polling: NodeJS.Timeout | null = null;

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
      BTC_PROTOCOL_NAME,
      BTC_SYMBOL,
      DUST_AMOUNT,
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
