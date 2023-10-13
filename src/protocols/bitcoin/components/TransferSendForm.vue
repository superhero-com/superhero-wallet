<template>
  <TransferSendFormBase
    v-bind="$attrs"
    :transfer-data="transferData"
    :fee="numericFee"
    :fee-symbol="BTC_SYMBOL"
    :protocol="PROTOCOL_BITCOIN"
    :custom-title="$t('modals.send.sendAsset', { name: BTC_COIN_NAME })"
    class="transfer-send-form"
  >
    <template #recipient>
      <TransferSendRecipient
        v-model.trim="formModel.address"
        :placeholder="$t('modals.send.recipientPlaceholderProtocol', { name: PROTOCOL_BITCOIN })"
        :errors="errors"
        :protocol="PROTOCOL_BITCOIN"
        :validation-rules="{ address_btc: [activeNetwork.type] }"
        @openQrModal="openScanQrModal"
      />
    </template>

    <template #amount>
      <TransferSendAmount
        v-model="formModel.amount"
        :errors="errors"
        :selected-asset="formModel.selectedAsset"
        readonly
        :protocol="PROTOCOL_BITCOIN"
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
          <BtnPlain
            class="max-button"
            :class="{ chosen: formModel.amount.toString() === max.toString() }"
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
import { toBitcoin } from 'satoshi-bitcoin';

import type { TransferFormModel } from '@/types';
import {
  useAccounts,
  useBalances,
  useNetworks,
} from '@/composables';
import { useTransferSendForm } from '@/composables/transferSendForm';
import { NETWORK_TYPE_TESTNET, PROTOCOL_BITCOIN } from '@/constants';
import {
  executeAndSetInterval,
  fetchJson,
} from '@/utils';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';
import Logger from '@/lib/logger';
import {
  BTC_COIN_NAME,
  BTC_SYMBOL,
  DUST_AMOUNT,
} from '@/protocols/bitcoin/config';

import { INFO_BOX_TYPES } from '@/popup/components/InfoBox.vue';
import DetailsItem from '@/popup/components/DetailsItem.vue';
import TransferSendFormBase from '@/popup/components/TransferSendFormBase.vue';
import TransferSendRecipient from '@/popup/components/TransferSend/TransferSendRecipient.vue';
import TransferSendAmount from '@/popup/components/TransferSend/TransferSendAmount.vue';
import TransactionSpeedPicker, { FeeItem } from '@/popup/components/TransactionSpeedPicker.vue';
import BtnPlain from '@/popup/components/buttons/BtnPlain.vue';

import EditIcon from '@/icons/pencil.svg?vue-component';
import DeleteIcon from '@/icons/trash.svg?vue-component';
import PlusCircleIcon from '@/icons/plus-circle-fill.svg?vue-component';

export default defineComponent({
  name: 'BtcTransferSendForm',
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
    const bitcoinAdapter = ProtocolAdapterFactory.getAdapter(PROTOCOL_BITCOIN);

    const route = useRoute();
    const { t } = useI18n();
    const { activeNetwork } = useNetworks();
    const { balance } = useBalances();
    const { activeAccount } = useAccounts();

    const hasMultisigTokenWarning = ref(false);
    const isUrlTippingEnabled = ref(false);

    const {
      formModel,
      errors,
      hasError,
      invoiceId,
      invoiceContract,
      clearPayload,
      openScanQrModal,
      handleAssetChange,
      updateFormModelValues,
    } = useTransferSendForm({
      transferData: props.transferData,
      protocol: PROTOCOL_BITCOIN,
    });

    const feeSelectedIndex = ref(1);
    const feeSlow = ref(new BigNumber(0.00002));
    const feeMedium = ref(new BigNumber(0.00002));
    const feeHigh = ref(new BigNumber(0.00002));

    const feeList = computed((): FeeItem[] => [
      { fee: feeSlow.value, time: 3540, label: t('common.transferSpeed.slow') },
      { fee: feeMedium.value, time: 600, label: t('common.transferSpeed.medium') },
      { fee: feeHigh.value, time: 25, label: t('common.transferSpeed.fast') },
    ]);
    const fee = computed(() => feeList.value[feeSelectedIndex.value].fee);

    const numericFee = computed(() => +fee.value.toFixed());
    const max = computed(() => balance.value.minus(fee.value));

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
      try {
        const byteSize = (await bitcoinAdapter.constructAndSignTx(
          // TODO: changed to 0 because balance.value can differs
          // from totalAmount from constructAndSignTx (balance is not being updated fast enough)
          // consider returning an actual amount in future
          0,
          formModel.value.address || activeAccount.value.address,
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
      INFO_BOX_TYPES,
      BTC_SYMBOL,
      BTC_COIN_NAME,
      DUST_AMOUNT,
      PROTOCOL_BITCOIN,
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
      openScanQrModal,
      handleAssetChange,
      EditIcon,
      DeleteIcon,
      PlusCircleIcon,
      submit,
      setMaxAmount,
      toBitcoin,
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
