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
  useModals,
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
    const { openDefaultModal } = useModals();
    const { activeAccount, getLastActiveProtocolAccount } = useAccounts();
    const { addAccountPendingTransaction } = useLatestTransactionList();

    const loading = ref<boolean>(false);

    function openTransactionFailedModal(msg: string) {
      openDefaultModal({
        title: t('modals.transaction-failed.title'),
        icon: 'critical',
        msg,
        textCenter: true,
      });
    }

    // TODO: replace that
    // This is happening because of inner TemplateRenderer issue on parsing the blocksteam response
    function HtmlEncode(content: string) {
      const textAreaDiv = document.createElement('textarea');
      textAreaDiv.textContent = content;
      return textAreaDiv.innerHTML;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async function transfer({ amount, recipient, selectedAsset }: ITransferArgs) {
      const bitcoinAdapter = ProtocolAdapterFactory.getAdapter(PROTOCOLS.bitcoin);
      try {
        loading.value = true;
        const { hash } = await bitcoinAdapter.spend(BigNumber(amount).toNumber(), recipient, {
          fee: props.transferData.fee?.toNumber(),
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
        throw error;
      } finally {
        loading.value = false;
      }
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
            fee: props.transferData.fee?.toNumber() ?? 0,
          },
        };
        addAccountPendingTransaction(lastActiveBtcAccount?.address!, transaction);
      }

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
