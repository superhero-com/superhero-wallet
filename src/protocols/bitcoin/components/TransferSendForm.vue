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
        :validation-rules="{
          name_registered_address: false,
        }"
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
          ...+balance.minus(fee) > 0 ? { max_value: max.toString() } : {},
          enough_coin: [fee.toString(), BTC_SYMBOL],
        }"
        @asset-selected="handleAssetChange"
      >
        <template #label-after>
          <BtnPlain
            class="max-button"
            :class="{ chosen: formModel.amount.toString() === max.toString() }"
            @click="formModel.amount = max.isPositive() ? max : 0"
          >
            {{ $t('common.max') }}
          </BtnPlain>
        </template>
      </TransferSendAmount>
    </template>

    <template
      #extra
    >
      <DetailsItem
        :label="$t('modals.send.transactionSpeed')"
      >
        <template #value>
          <TransactionSpeedPicker
            :fee-list="feeList"
            @changeFee="(value) => setFee(value)"
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
import { useStore } from 'vuex';
import BigNumber from 'bignumber.js';
import { toBitcoin } from 'satoshi-bitcoin';

import { useNetworks } from '@/composables/networks';
import {
  useAccounts,
  useBalances,
} from '@/composables';
import type {
  TransferFormModel,
} from '@/types';
import { BTC_COIN_NAME, BTC_SYMBOL } from '@/protocols/bitcoin/config';
import { useTransferSendForm } from '@/composables/transferSendForm';
import { PROTOCOL_BITCOIN } from '@/constants';

import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';
import { INFO_BOX_TYPES } from '@/popup/components/InfoBox.vue';
import DetailsItem from '@/popup/components/DetailsItem.vue';
import TransferSendFormBase from '@/popup/components/TransferSendFormBase.vue';
import TransferSendRecipient from '@/popup/components/TransferSend/TransferSendRecipient.vue';
import TransferSendAmount from '@/popup/components/TransferSend/TransferSendAmount.vue';
import TransactionSpeedPicker from '@/popup/components/TransactionSpeedPicker.vue';

import EditIcon from '@/icons/pencil.svg?vue-component';
import DeleteIcon from '@/icons/trash.svg?vue-component';
import PlusCircleIcon from '@/icons/plus-circle-fill.svg?vue-component';
import { fetchJson, executeAndSetInterval } from '@/utils';

export default defineComponent({
  name: 'BtcTransferSendForm',
  components: {
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
  emits: ['update:transferData', 'success', 'error'],
  setup(props, { emit }) {
    const store = useStore();

    const hasMultisigTokenWarning = ref(false);
    const isUrlTippingEnabled = ref(false);

    const { balance } = useBalances({ store });
    const {
      activeAccount,
    } = useAccounts({ store });

    const {
      formModel,
      errors,
      hasError,
      invoiceId,
      invoiceContract,
      clearPayload,
      openScanQrModal,
      handleAssetChange,
    } = useTransferSendForm({
      transferData: props.transferData,
    });

    const fee = ref(new BigNumber(0));
    const feeList = ref([
      { fee: new BigNumber(0.00002), time: 3540 },
      { fee: new BigNumber(0.00004), time: 600 },
      { fee: new BigNumber(0.00005), time: 25 },
    ]);

    const numericFee = computed(() => +fee.value.toFixed());
    const max = computed(() => balance.value.minus(fee.value));

    function setFee(value: BigNumber) {
      fee.value = value;
    }

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

    async function updateFeeList() {
      const { activeNetwork } = useNetworks();
      const bitcoinAdapter = ProtocolAdapterFactory.getAdapter(PROTOCOL_BITCOIN);
      const byteSize = (await bitcoinAdapter.constructAndSignTx(
        // TODO: changed to 0 because balance.value can differs
        // from totalAmount from constructAndSignTx (balance is not being updated fast enough)
        // consider returning an actual amount in future
        0,
        formModel.value.address! || activeAccount.value.address,
        {
          fee: 0,
          ...activeAccount.value,
        },
      )).virtualSize();
      const { nodeUrl } = activeNetwork.value.protocols.bitcoin;

      const feeRate = (await fetchJson(`${nodeUrl}/fee-estimates`))['5'];
      const feeStepFactor = new BigNumber(0.5);
      const mediumFee = new BigNumber(Math.ceil(feeRate * byteSize));

      feeList.value = [
        {
          fee: new BigNumber(toBitcoin(Math.ceil(mediumFee.minus(
            mediumFee.times(feeStepFactor),
          ).toNumber()))),
          time: 3540,
        },
        { fee: new BigNumber(toBitcoin(mediumFee.toNumber())), time: 600 },
        {
          fee: new BigNumber(toBitcoin(Math.ceil(mediumFee.plus(
            mediumFee.times(feeStepFactor),
          ).toNumber()))),
          time: 25,
        },
      ];
    }

    let polling: NodeJS.Timer | null = null;

    onMounted(() => {
      polling = executeAndSetInterval(() => {
        updateFeeList();
      }, 5000);
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
      PROTOCOL_BITCOIN,
      hasMultisigTokenWarning,
      formModel,
      isUrlTippingEnabled,
      fee,
      numericFee,
      activeAccount,
      feeList,
      errors,
      balance,
      max,
      clearPayload,
      openScanQrModal,
      handleAssetChange,
      setFee,
      EditIcon,
      DeleteIcon,
      PlusCircleIcon,
      submit,
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
