<template>
  <TransferSendFormBase
    v-bind="$attrs"
    :transfer-data="transferData"
    :fee="numericFee"
    :fee-symbol="BTC_SYMBOL"
    :protocol="PROTOCOL_BITCOIN"
    :custom-title="$t('modals.send.sendBtc')"
    class="transfer-send-form"
  >
    <template #recipient>
      <!--      TODO - set validation rules -->
      <TransferSendRecipient
        v-model.trim="formModel.address"
        :placeholder="$t('modals.send.recipientPlaceholderBtc')"
        :errors="errors"
        :validation-rules="{}"
        @openQrModal="openScanQrModal"
      />
    </template>

    <template #amount>
      <!--      TODO - set validation rules -->
      <TransferSendAmount
        v-model="formModel.amount"
        :errors="errors"
        :selected-asset="formModel.selectedAsset"
        readonly
        :protocol="PROTOCOL_BITCOIN"
        :validation-rules="{}"
        @asset-selected="handleAssetChange"
      >
        <!--    TODO - set max amount for BTC -->
        <!--        <template #label-after>-->
        <!--          <BtnPlain-->
        <!--            class="max-button"-->
        <!--            :class="{ chosen: isMaxValue }"-->
        <!--            @click="setMaxValue"-->
        <!--          >-->
        <!--            {{ $t('common.max') }}-->
        <!--          </BtnPlain>-->
        <!--        </template>-->
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
  PropType,
  ref,
  watch,
} from 'vue';
import { useStore } from 'vuex';
import BigNumber from 'bignumber.js';
import {
  useAccounts,
  useBalances,
} from '@/composables';
import type {
  TransferFormModel,
} from '@/types';
import { BTC_SYMBOL } from '@/protocols/bitcoin/config';
import { useTransferSendForm } from '@/composables/transferSendForm';
import { PROTOCOL_BITCOIN } from '@/constants';

import { INFO_BOX_TYPES } from '@/popup/components/InfoBox.vue';
import DetailsItem from '@/popup/components/DetailsItem.vue';
import TransferSendFormBase from '@/popup/components/TransferSendFormBase.vue';
import TransferSendRecipient from '@/popup/components/TransferSend/TransferSendRecipient.vue';
import TransferSendAmount from '@/popup/components/TransferSend/TransferSendAmount.vue';
import TransactionSpeedPicker from '@/popup/components/TransactionSpeedPicker.vue';

import EditIcon from '@/icons/pencil.svg?vue-component';
import DeleteIcon from '@/icons/trash.svg?vue-component';
import PlusCircleIcon from '@/icons/plus-circle-fill.svg?vue-component';

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

    // TODO - fee set proper values
    const fee = ref(new BigNumber(0));
    const feeList = [
      { fee: new BigNumber(0.1), time: 3540 },
      { fee: new BigNumber(0.2), time: 600 },
      { fee: new BigNumber(0.3), time: 25 },
    ];

    const numericFee = computed(() => +fee.value.toFixed());

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
