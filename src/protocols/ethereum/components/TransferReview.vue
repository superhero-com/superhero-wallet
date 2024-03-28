<template>
  <TransferReviewBase
    :base-token-symbol="ETH_COIN_SYMBOL"
    :transfer-data="transferData"
    :loading="loading"
    :protocol="PROTOCOLS.ethereum"
    :show-fiat="isSelectedAssetEthCoin"
    class="transfer-review"
  >
    <template #total>
      <DetailsItem
        v-if="isSelectedAssetEthCoin"
        :label="$t('common.total')"
        class="details-item"
      >
        <template #value>
          <TokenAmount
            :amount="+transferData.total!"
            :symbol="ETH_COIN_SYMBOL"
            :protocol="PROTOCOLS.ethereum"
            data-cy="review-total"
            high-precision
          />
        </template>
      </DetailsItem>
    </template>
  </TransferReviewBase>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  PropType,
  ref,
} from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import type { ITransaction, TransferFormModel } from '@/types';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';
import {
  useAccounts,
  useLatestTransactionList,
  useModals,
  useUi,
} from '@/composables';
import { PROTOCOLS } from '@/constants';
import { ETH_COIN_SYMBOL } from '@/protocols/ethereum/config';

import TransferReviewBase from '@/popup/components/TransferSend/TransferReviewBase.vue';
import DetailsItem from '@/popup/components/DetailsItem.vue';
import TokenAmount from '@/popup/components/TokenAmount.vue';

export default defineComponent({
  name: 'EthTransferReview',
  components: {
    TokenAmount,
    DetailsItem,
    TransferReviewBase,
  },
  model: {
    prop: 'transferData',
  },
  props: {
    transferData: { type: Object as PropType<TransferFormModel>, required: true },
  },
  setup(props, { emit }) {
    const { t } = useI18n();
    const router = useRouter();
    const { homeRouteName } = useUi();
    const { openDefaultModal } = useModals();
    const { getLastActiveProtocolAccount } = useAccounts();
    const { addAccountPendingTransaction } = useLatestTransactionList();

    const loading = ref<boolean>(false);

    const ethAdapter = ProtocolAdapterFactory.getAdapter(PROTOCOLS.ethereum);

    const isSelectedAssetEthCoin = computed(
      () => props.transferData?.selectedAsset?.contractId === ethAdapter.coinContractId,
    );

    function openTransactionFailedModal(msg: string) {
      openDefaultModal({
        title: t('modals.transaction-failed.msg'),
        icon: 'critical',
        msg,
      });
    }

    async function submit(): Promise<void> {
      const {
        amount,
        address: recipient,
        selectedAsset,
      } = props.transferData;

      if (!amount || !recipient || !selectedAsset) {
        return;
      }

      loading.value = true;
      let actionResult;
      const lastActiveEthAccount = getLastActiveProtocolAccount(PROTOCOLS.ethereum);

      try {
        if (!isSelectedAssetEthCoin.value) {
          actionResult = await ethAdapter.transferToken?.(
            Number(amount),
            recipient,
            selectedAsset.contractId,
            {
              fromAccount: lastActiveEthAccount?.address,
              maxPriorityFeePerGas: props.transferData.maxPriorityFeePerGas,
              maxFeePerGas: props.transferData.maxFeePerGas,
            },
          );
        } else {
          actionResult = await ethAdapter.spend(
            Number(amount),
            recipient,
            {
              fromAccount: lastActiveEthAccount?.address,
              maxPriorityFeePerGas: props.transferData.maxPriorityFeePerGas,
              maxFeePerGas: props.transferData.maxFeePerGas,
            },
          );
        }

        if (actionResult) {
          const transaction: ITransaction = {
            hash: actionResult.hash as any,
            pending: true,
            transactionOwner: lastActiveEthAccount?.address,
            protocol: PROTOCOLS.ethereum,
            tx: {
              amount: Number(amount),
              callerId: lastActiveEthAccount?.address!,
              contractId: selectedAsset.contractId as any,
              senderId: lastActiveEthAccount?.address,
              type: (isSelectedAssetEthCoin.value) ? 'SpendTx' : 'ContractCallTx',
              function: 'transfer',
              recipientId: recipient,
              arguments: [],
              fee: 0,
            },
          };
          addAccountPendingTransaction(lastActiveEthAccount?.address!, transaction);
        }
      } catch (error: any) {
        openTransactionFailedModal(error.message);
        throw error;
      } finally {
        loading.value = false;
      }

      router.push({ name: homeRouteName.value });
      emit('success');
    }

    return {
      PROTOCOLS,
      ETH_COIN_SYMBOL,
      loading,
      isSelectedAssetEthCoin,
      submit,
    };
  },
});
</script>

<style scoped lang="scss">
.transfer-review {
  .details-item {
    margin-top: 16px;
  }
}
</style>
