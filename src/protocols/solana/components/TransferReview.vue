<template>
  <TransferReviewBase
    :base-token-symbol="SOL_COIN_SYMBOL"
    :transfer-data="transferData"
    :loading="loading"
    :protocol="PROTOCOLS.solana"
    :show-fiat="isSelectedAssetSolanaCoin"
    class="transfer-review"
  >
    <template #total>
      <DetailsItem
        v-if="isSelectedAssetSolanaCoin"
        :label="$t('common.total')"
        class="details-item"
      >
        <template #value>
          <TokenAmount
            :amount="Number(transferData.total || 0)"
            :symbol="SOL_COIN_SYMBOL"
            :protocol="PROTOCOLS.solana"
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
  useUi,
} from '@/composables';
import { PROTOCOLS } from '@/constants';
import { SOL_COIN_SYMBOL } from '@/protocols/solana/config';

import TransferReviewBase from '@/popup/components/TransferSend/TransferReviewBase.vue';
import DetailsItem from '@/popup/components/DetailsItem.vue';
import TokenAmount from '@/popup/components/TokenAmount.vue';
import Logger from '@/lib/logger';

export default defineComponent({
  name: 'SolanaTransferReview',
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
    const { getLastActiveProtocolAccount } = useAccounts();
    const { addAccountPendingTransaction } = useLatestTransactionList();

    const loading = ref<boolean>(false);

    const solanaAdapter = ProtocolAdapterFactory.getAdapter(PROTOCOLS.solana);

    const isSelectedAssetSolanaCoin = computed(
      () => props.transferData?.selectedAsset?.contractId === solanaAdapter.coinContractId,
    );

    function openTransactionFailedModal(msg: string) {
      Logger.write({
        title: t('modals.transaction-failed.title'),
        message: msg || t('modals.transaction-failed.msg'),
        type: 'api-response',
        modal: true,
      });
    }

    async function submit(): Promise<void> {
      const {
        amount,
        addresses: recipients,
        selectedAsset,
      } = props.transferData;

      if (!amount || !recipients?.length || !selectedAsset) {
        return;
      }

      loading.value = true;
      let actionResult;
      const lastActiveSolanaAccount = getLastActiveProtocolAccount(PROTOCOLS.solana);
      try {
        // eslint-disable-next-line no-restricted-syntax
        for (const recipient of recipients) {
          if (!isSelectedAssetSolanaCoin.value) {
            // eslint-disable-next-line no-await-in-loop
            actionResult = await solanaAdapter.transferToken?.(
              amount,
              recipient,
              selectedAsset.contractId,
              {
                fromAccount: lastActiveSolanaAccount?.address,
              },
            );
          } else {
            // eslint-disable-next-line no-await-in-loop
            actionResult = await solanaAdapter.spend(
              Number(amount),
              recipient,
              {
                fromAccount: lastActiveSolanaAccount?.address,
              },
            );
          }

          if (actionResult) {
            const transaction: ITransaction = {
              hash: actionResult.hash as any,
              pending: true,
              transactionOwner: lastActiveSolanaAccount?.address,
              protocol: PROTOCOLS.solana,
              tx: {
                amount: Number(amount),
                callerId: lastActiveSolanaAccount?.address!,
                contractId: selectedAsset.contractId as any,
                senderId: lastActiveSolanaAccount?.address,
                type: (isSelectedAssetSolanaCoin.value) ? 'SpendTx' : 'ContractCallTx',
                function: 'transfer',
                recipientId: recipient,
                arguments: [],
                fee: 0,
              },
            };
            addAccountPendingTransaction(lastActiveSolanaAccount?.address!, transaction);
          }
        }
      } catch (error: any) {
        openTransactionFailedModal(error.message);
        return;
      } finally {
        loading.value = false;
      }

      router.push({ name: homeRouteName.value });
      emit('success');
    }

    return {
      PROTOCOLS,
      SOL_COIN_SYMBOL,
      loading,
      isSelectedAssetSolanaCoin,
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
