<template>
  <div class="transfer-signed-tx-review">
    <ModalHeader
      :subtitle="$t('airGap.broadcast.subtitle')"
      no-padding
    >
      <template #title>
        <div class="custom-header-title">
          {{ $t('airGap.broadcast.title') }}
          <BtnHelp
            :title="$t('airGap.scan.help.title')"
            :msg="$t('airGap.scan.help.msg')"
            icon="qr-scan"
            full-screen
          />
        </div>
      </template>
    </ModalHeader>

    <FormScanQrResult
      v-model="syncCode"
      :label="$t('airGap.syncCode.inputLabel')"
      :placeholder="$t('airGap.syncCode.inputPlaceholder')"
      :qr-title="$t('airGap.scan.title')"
      @update:model-value="handleInput"
    />

    <template v-if="transferData">
      <DetailsItem
        :label="$t('pages.send.sender')"
        data-cy="review-sender"
      >
        <template #value>
          <AvatarWithChainName
            :address="senderId"
            show-address
          />
        </template>
      </DetailsItem>

      <DetailsItem
        class="details-item"
        data-cy="review-recipient"
        :label="$t('pages.send.recipient')"
      >
        <template #value>
          <AvatarWithChainName
            :address="recipientId"
            show-address
          />
        </template>
      </DetailsItem>

      <DetailsItem
        :label="$t('common.amount')"
        class="details-item"
      >
        <template #value>
          <TokenAmount
            :amount="+transferData.amount!"
            :symbol="AE_SYMBOL"
            :protocol="PROTOCOLS.aeternity"
          />
        </template>
      </DetailsItem>

      <DetailsItem
        class="details-item"
        :label="$t('transaction.fee')"
      >
        <template #value>
          <TokenAmount
            :amount="+transferData.fee!"
            :symbol="AE_SYMBOL"
            :protocol="PROTOCOLS.aeternity"
            high-precision
            data-cy="review-fee"
          />
        </template>
      </DetailsItem>

      <DetailsItem
        :label="$t('common.total')"
        class="details-item"
      >
        <template #value>
          <TokenAmount
            :amount="+transferData.total!"
            :symbol="AE_SYMBOL"
            :protocol="PROTOCOLS.aeternity"
            high-precision
            data-cy="review-total"
          />
        </template>
      </DetailsItem>
    </template>
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  onMounted,
  ref,
} from 'vue';
import BigNumber from 'bignumber.js';
import { Encoded, unpackTx, Tag } from '@aeternity/aepp-sdk';
import { TransferFormModel, ITransaction } from '@/types';
import { MODAL_DEFAULT, PROTOCOLS } from '@/constants';
import { parseCodeToBytes, toShiftedBigNumber } from '@/utils';
import { AE_CONTRACT_ID, AE_SYMBOL, TX_FUNCTIONS } from '@/protocols/aeternity/config';
import {
  useAeSdk,
  useModals,
  useAccounts,
  useLatestTransactionList,
  useAirGap,
} from '@/composables';
import { aettosToAe, aeToAettos } from '@/protocols/aeternity/helpers';
import { tg } from '@/popup/plugins/i18n';

import DetailsItem from '@/popup/components/DetailsItem.vue';
import TokenAmount from '@/popup/components/TokenAmount.vue';
import AvatarWithChainName from '@/popup/components/AvatarWithChainName.vue';
import ModalHeader from '@/popup/components/ModalHeader.vue';
import BtnHelp from '@/popup/components/buttons/BtnHelp.vue';
import FormScanQrResult from '@/popup/components/form/FormScanQrResult.vue';
import Logger from '@/lib/logger';

export default defineComponent({
  name: 'TransferSignedTxReview',
  components: {
    ModalHeader,
    AvatarWithChainName,
    DetailsItem,
    TokenAmount,
    FormScanQrResult,
    BtnHelp,
  },
  emits: ['success', 'error'],
  setup(_, { emit }) {
    const { openModal } = useModals();
    const { getAeSdk } = useAeSdk();
    const { extractSignedTransactionResponseData, deserializeData } = useAirGap();

    const transferData = ref<TransferFormModel>();
    const recipientId = ref();
    const senderId = ref();
    const txRaw = ref();
    const syncCode = ref('');

    function getTransferData(rawTx: Encoded.Transaction) {
      const { encodedTx } = unpackTx<Tag.SignedTx>(rawTx) as any;
      if (!encodedTx) {
        return undefined;
      }
      recipientId.value = encodedTx?.recipientId;
      senderId.value = encodedTx?.senderId;
      const fee = new BigNumber(aettosToAe(encodedTx?.fee || 0));
      const amount = new BigNumber(aettosToAe(encodedTx?.amount || 0));

      return {
        amount: aettosToAe(encodedTx?.amount || 0).toString(),
        fee,
        total: fee.plus(amount).toNumber(),
        payload: encodedTx.payload,
      };
    }

    async function getRawTx() {
      let parsedCode;

      try {
        // Codes copied from AirGap need to be parsed
        parsedCode = await parseCodeToBytes(syncCode.value);
      } catch (e) {
        parsedCode = syncCode.value;
      }
      const deserializedData = await deserializeData(parsedCode!);

      txRaw.value = await extractSignedTransactionResponseData(deserializedData);
      transferData.value = getTransferData(txRaw.value);
    }

    async function submit() {
      emit('success');

      try {
        const aeSdk = await getAeSdk();
        const { activeAccount } = useAccounts();
        const { addAccountPendingTransaction } = useLatestTransactionList();

        const transaction = await aeSdk.api.postTransaction({ tx: txRaw.value });

        openModal(MODAL_DEFAULT, {
          // Modal that is referenced in design (SpendSuccess) has been removed
          title: tg('pages.send.title'),
          transaction,
        });

        const {
          amount: amountRaw,
          fee,
          selectedAsset,
          address: recipient,
        } = transferData.value!;
        const isSelectedAssetAeCoin = selectedAsset?.contractId === AE_CONTRACT_ID;

        if (!amountRaw || !recipient || !selectedAsset) {
          return;
        }

        const amount = (selectedAsset?.contractId === AE_CONTRACT_ID)
          ? aeToAettos(amountRaw)
          : toShiftedBigNumber(amountRaw, selectedAsset?.decimals!);

        const tempTransaction: ITransaction = {
          hash: transaction.txHash,
          pending: true,
          transactionOwner: activeAccount.value.address,
          protocol: PROTOCOLS.aeternity,
          tx: {
            amount: Number(amount),
            callerId: activeAccount.value.address,
            contractId: selectedAsset?.contractId as Encoded.ContractAddress,
            senderId: activeAccount.value.address,
            type: (isSelectedAssetAeCoin) ? Tag[Tag.SpendTx] : Tag[Tag.ContractCallTx],
            function: TX_FUNCTIONS.transfer,
            recipientId: recipient,
            arguments: [],
            fee: Number(fee),
          },
        };
        addAccountPendingTransaction(activeAccount.value.address, tempTransaction);
      } catch (error: any) {
        Logger.write({
          title: tg('modals.transaction-failed.title'),
          message: error.message || tg('modals.transaction-failed.msg'),
          type: 'api-response',
          modal: true,
        });
      }
    }

    async function handleInput() {
      txRaw.value = null;
      transferData.value = undefined;
      try {
        await getRawTx();
        emit('error', false);
      } catch (e) {
        emit('error', true);
      }
    }

    onMounted(() => {
      // Disable send button until sync code is entered
      emit('error', true);
    });

    return {
      AE_SYMBOL,
      AE_CONTRACT_ID,
      PROTOCOLS,
      transferData,
      senderId,
      recipientId,
      syncCode,
      submit,
      aettosToAe,
      handleInput,
    };
  },
});
</script>

<style scoped lang="scss">
.transfer-signed-tx-review {
  .details-item {
    margin-top: 16px;
  }

  .custom-header-title {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 10px;
  }
}
</style>
