<template>
  <TransferReviewBase
    :base-token-symbol="DOGE_SYMBOL"
    :transfer-data="transferData"
    :loading="loading"
    show-fiat
    :protocol="PROTOCOLS.dogecoin"
    class="transfer-review"
  >
    <template #total>
      <DetailsItem
        :label="$t('common.total')"
        class="details-item"
      >
        <template #value>
          <TokenAmount
            :amount="reviewTotal"
            :symbol="DOGE_SYMBOL"
            high-precision
            :protocol="PROTOCOLS.dogecoin"
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
  computed,
} from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { PROTOCOLS } from '@/constants';
import TransferReviewBase from '@/popup/components/TransferSend/TransferReviewBase.vue';
import DetailsItem from '@/popup/components/DetailsItem.vue';
import TokenAmount from '@/popup/components/TokenAmount.vue';
import { DOGE_SYMBOL } from '@/protocols/dogecoin/config';
import type { TransferFormModel } from '@/types';
import {
  useAccounts,
  useLatestTransactionList,
  useUi,
} from '@/composables';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';
import BigNumber from 'bignumber.js';
import Logger from '@/lib/logger';

export default defineComponent({
  name: 'DogeTransferReview',
  components: { TokenAmount, DetailsItem, TransferReviewBase },
  model: { prop: 'transferData' },
  props: { transferData: { type: Object as PropType<TransferFormModel>, required: true } },
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

    function HtmlEncode(content: string) {
      const textAreaDiv = document.createElement('textarea');
      textAreaDiv.textContent = content;
      return textAreaDiv.innerHTML;
    }

    async function transfer({ amount, recipient }: { amount: string | number; recipient: string }) {
      const dogeAdapter = ProtocolAdapterFactory.getAdapter(PROTOCOLS.dogecoin);
      try {
        const { hash } = await dogeAdapter.spend(
          BigNumber(amount).toNumber(),
          recipient,
          {
            fee: props.transferData.fee
              ?.dividedBy(props.transferData.addresses?.length || 1).toNumber(),
            ...activeAccount.value,
          },
        );
        return hash as string;
      } catch (error: any) {
        const processedErrorMessage = HtmlEncode(error.message);
        openTransactionFailedModal(processedErrorMessage);
        return undefined;
      }
    }

    async function submit(): Promise<void> {
      const {
        amount,
        addresses: recipients,
        selectedAsset,
      } = props.transferData;

      if (!amount || !recipients?.length || !selectedAsset) return;

      loading.value = true;
      // eslint-disable-next-line no-restricted-syntax
      for (const recipient of recipients) {
        // eslint-disable-next-line no-await-in-loop
        const hash = await transfer({ amount, recipient });
        if (hash) {
          const lastActiveDogeAccount = getLastActiveProtocolAccount(PROTOCOLS.dogecoin);
          addAccountPendingTransaction(lastActiveDogeAccount?.address!, {
            hash: hash as any,
            pending: true,
            transactionOwner: lastActiveDogeAccount?.address,
            protocol: PROTOCOLS.dogecoin,
            tx: {
              amount: Number(amount),
              callerId: lastActiveDogeAccount?.address!,
              contractId: selectedAsset.contractId as any,
              senderId: lastActiveDogeAccount?.address,
              type: 'SpendTx',
              recipientId: recipient,
              arguments: [],
              fee: props.transferData.fee?.dividedBy(recipients.length).toNumber() ?? 0,
            },
          } as any);
        }
        // eslint-disable-next-line no-await-in-loop
        await new Promise((resolve) => setTimeout(resolve, 10000));
      }
      loading.value = false;

      router.push({ name: homeRouteName.value });
      emit('success');
    }

    const reviewTotal = computed(() => +(props.transferData.total || 0));

    return {
      PROTOCOLS,
      DOGE_SYMBOL,
      loading,
      reviewTotal,
      submit,
    };
  },
});
</script>
