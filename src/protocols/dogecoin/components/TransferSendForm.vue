<template>
  <TransferSendFormBase
    v-bind="$attrs"
    :transfer-data="transferData"
    :fee="0"
    :fee-symbol="DOGE_SYMBOL"
    :protocol="PROTOCOLS.dogecoin"
    :custom-title="$t('modals.send.sendAsset', { name: DOGE_PROTOCOL_NAME })"
    class="transfer-send-form"
  >
    <template #recipient>
      <TransferSendRecipient
        v-model="formModel.addresses"
        :max-recipients="1"
        :placeholder="$t('modals.send.recipientPlaceholderProtocol', { name: PROTOCOLS.dogecoin })"
        :errors="errors"
        :protocol="PROTOCOLS.dogecoin"
        :validation-rules="{ account_address: [PROTOCOLS.dogecoin] }"
        @openQrModal="scanTransferQrCode()"
      />
    </template>

    <template #amount>
      <TransferSendAmount
        v-model="formModel.amount"
        :errors="errors"
        :selected-asset="formModel.selectedAsset"
        :protocol="PROTOCOLS.dogecoin"
      />
    </template>
  </TransferSendFormBase>
</template>

<script lang="ts">
import {
  defineComponent,
  nextTick,
  PropType,
} from 'vue';
import type { TransferFormModel } from '@/types';
import { useAccounts, useBalances } from '@/composables';
import { useTransferSendForm } from '@/composables/transferSendForm';
import { PROTOCOLS } from '@/constants';
import { DOGE_PROTOCOL_NAME, DOGE_SYMBOL } from '@/protocols/dogecoin/config';

import TransferSendFormBase from '@/popup/components/TransferSendFormBase.vue';
import TransferSendRecipient from '@/popup/components/TransferSend/TransferSendRecipient.vue';
import TransferSendAmount from '@/popup/components/TransferSend/TransferSendAmount.vue';

export default defineComponent({
  name: 'DogeTransferSendForm',
  components: { TransferSendAmount, TransferSendRecipient, TransferSendFormBase },
  model: { prop: 'transferData' },
  props: { transferData: { type: Object as PropType<TransferFormModel>, required: true } },
  emits: ['update:transferData', 'success', 'error'],
  setup(props, { emit }) {
    const { balance } = useBalances();
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

    function emitCurrentFormModelState() {
      const inputPayload = {
        ...formModel.value,
        total: +(formModel.value?.amount || 0),
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

    return {
      DOGE_PROTOCOL_NAME,
      DOGE_SYMBOL,
      PROTOCOLS,
      balance,
      activeAccount,
      formModel,
      errors,
      hasError,
      handleAssetChange,
      scanTransferQrCode,
      submit,
    };
  },
});
</script>
