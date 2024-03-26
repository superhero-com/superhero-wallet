<template>
  <Loader v-if="!transferData" />
  <div
    v-else
    class="transfer-raw-tx-review"
  >
    <ModalHeader :title="$t('modals.transferRawTx.title')" />
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
import { toShiftedBigNumber } from '@/utils';
import { AE_CONTRACT_ID, AE_SYMBOL, TX_FUNCTIONS } from '@/protocols/aeternity/config';
import {
  useAeSdk,
  useModals,
  useAccounts,
  useLatestTransactionList,
} from '@/composables';
import { aettosToAe, aeToAettos } from '@/protocols/aeternity/helpers';
import { tg } from '@/popup/plugins/i18n';

import DetailsItem from '@/popup/components/DetailsItem.vue';
import TokenAmount from '@/popup/components/TokenAmount.vue';
import AvatarWithChainName from '@/popup/components/AvatarWithChainName.vue';
import ModalHeader from '@/popup/components/ModalHeader.vue';
import Loader from '@/popup/components/Loader.vue';

export default defineComponent({
  name: 'TransferRawTxReview',
  components: {
    ModalHeader,
    AvatarWithChainName,
    DetailsItem,
    TokenAmount,
    Loader,
  },
  props: {
    txRaw: { type: String, required: true },
  },
  setup(props, { emit }) {
    const { openModal } = useModals();
    const { getAeSdk } = useAeSdk();

    const transferData = ref<TransferFormModel>();
    const loading = ref<boolean>(true);
    const recipientId = ref();
    const senderId = ref();

    async function submit() {
      emit('success');
      try {
        const aeSdk = await getAeSdk();
        const { activeAccount } = useAccounts();
        const { addAccountPendingTransaction } = useLatestTransactionList();

        const transaction = await aeSdk.api.postTransaction({ tx: props.txRaw });

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
      } catch (error) {
        openModal(MODAL_DEFAULT, {
          title: tg('modals.transaction-failed.msg'),
          icon: 'critical',
        });
      }
    }

    onMounted(() => {
      const { encodedTx } = unpackTx<Tag.SignedTx>(props.txRaw as Encoded.Transaction) as any;
      if (!encodedTx) {
        return;
      }
      recipientId.value = encodedTx?.recipientId;
      senderId.value = encodedTx?.senderId;
      const fee = new BigNumber(aettosToAe(encodedTx?.fee || 0));
      const amount = new BigNumber(aettosToAe(encodedTx?.amount || 0));

      transferData.value = {
        amount: aettosToAe(encodedTx?.amount || 0).toString(),
        fee,
        total: fee.plus(amount).toNumber(),
        payload: encodedTx.payload,
      };
    });

    return {
      AE_SYMBOL,
      AE_CONTRACT_ID,
      PROTOCOLS,
      loading,
      submit,
      aettosToAe,
      transferData,
      senderId,
      recipientId,
    };
  },
});
</script>

<style scoped lang="scss">
.transfer-raw-tx-review {
  .details-item {
    margin-top: 16px;
  }
}
</style>
