<template>
  <TransferReviewBase
    :base-token-symbol="BTC_SYMBOL"
    :transfer-data="transferData"
    :loading="loading"
    show-fiat
    :protocol="PROTOCOLS.bitcoin"
    class="transfer-review"
  >
    <template #total>
      <DetailsItem
        :label="$t('common.total')"
        class="details-item"
      >
        <template #value>
          <TokenAmount
            :amount="+transferData.total!"
            :symbol="BTC_SYMBOL"
            high-precision
            :protocol="PROTOCOLS.bitcoin"
            data-cy="review-total"
          />
        </template>
      </DetailsItem>
    </template>
  </TransferReviewBase>
</template>

<script lang="ts">
import {
  defineComponent,
  PropType,
  ref,
} from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import {
  useAccounts,
  useLatestTransactionList,
  useUi,
} from '@/composables';
import type { ITransaction, ITransferArgs, TransferFormModel } from '@/types';
import { PROTOCOLS } from '@/constants';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';

import TransferReviewBase from '@/popup/components/TransferSend/TransferReviewBase.vue';
import DetailsItem from '@/popup/components/DetailsItem.vue';
import TokenAmount from '@/popup/components/TokenAmount.vue';
import { BTC_SYMBOL } from '@/protocols/bitcoin/config';
import BigNumber from 'bignumber.js';
import Logger from '@/lib/logger';

export default defineComponent({
  name: 'BtcTransferReview',
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
    const { activeAccount, getLastActiveProtocolAccount } = useAccounts();
    const { addAccountPendingTransaction } = useLatestTransactionList();

    const loading = ref<boolean>(false);

    function openTransactionFailedModal(msg: string) {
      Logger.write({
        title: t('modals.transaction-failed.title'),
        message: msg || t('modals.transaction-failed.msg'),
        type: 'api-response',
        modal: true,
      });
    }

    // TODO: replace that
    // This is happening because of inner TemplateRenderer issue on parsing the blocksteam response
    function HtmlEncode(content: string) {
      const textAreaDiv = document.createElement('textarea');
      textAreaDiv.textContent = content;
      return textAreaDiv.innerHTML;
    }

    async function transfer(
      { amount, recipient }: ITransferArgs,
    ): Promise<string | undefined> {
      const bitcoinAdapter = ProtocolAdapterFactory.getAdapter(PROTOCOLS.bitcoin);
      try {
        const { hash } = await bitcoinAdapter.spend(BigNumber(amount).toNumber(), recipient, {
          fee: props.transferData.fee
            ?.dividedBy(props.transferData.addresses?.length || 1).toNumber(),
          ...activeAccount.value,
        });
        return hash;
      } catch (error: any) {
        const processedErrorMessage = HtmlEncode(error.message);
        if (processedErrorMessage.includes('dust')) {
          openTransactionFailedModal(t('modals.transaction-failed.dustError'));
        } else {
          openTransactionFailedModal(processedErrorMessage);
        }
        return undefined;
      }
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
      // eslint-disable-next-line no-restricted-syntax
      for (const recipient of recipients) {
        // eslint-disable-next-line no-await-in-loop
        const hash = await transfer({
          amount,
          recipient,
          selectedAsset,
        });

        if (hash) {
          const lastActiveBtcAccount = getLastActiveProtocolAccount(PROTOCOLS.bitcoin);
          const transaction: ITransaction = {
            hash: hash as any,
            pending: true,
            transactionOwner: lastActiveBtcAccount?.address,
            protocol: PROTOCOLS.bitcoin,
            tx: {
              amount: Number(amount),
              callerId: lastActiveBtcAccount?.address!,
              contractId: selectedAsset.contractId as any,
              senderId: lastActiveBtcAccount?.address,
              type: 'SpendTx',
              recipientId: recipient,
              arguments: [],
              fee: props.transferData.fee?.dividedBy(recipients.length).toNumber() ?? 0,
            },
          };
          addAccountPendingTransaction(lastActiveBtcAccount?.address!, transaction);
        }
        /**
         * A timeout is necessary to allow the blockchain to have time
         * to submit the previous transaction in case there are multiple recipients
         */
        // eslint-disable-next-line no-await-in-loop
        await new Promise((resolve) => setTimeout(resolve, 10000));
      }
      loading.value = false;

      // TODO - redirect after transfer function will be ready
      router.push({ name: homeRouteName.value });
      emit('success');
    }

    return {
      PROTOCOLS,
      BTC_SYMBOL,
      loading,
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
