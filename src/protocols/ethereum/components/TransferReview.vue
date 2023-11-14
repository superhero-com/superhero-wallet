<template>
  <TransferReviewBase
    :base-token-symbol="ETH_SYMBOL"
    :transfer-data="transferData"
    :loading="loading"
    :protocol="PROTOCOL_ETHEREUM"
    class="transfer-review"
    show-fiat
  >
    <template #total>
      <DetailsItem
        :label="$t('common.total')"
        class="details-item"
      >
        <template #value>
          <TokenAmount
            :amount="+transferData.total"
            :symbol="ETH_SYMBOL"
            :protocol="PROTOCOL_ETHEREUM"
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
  defineComponent,
  PropType,
  ref,
} from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAccounts, useModals, useUi } from '@/composables';
import type { TransferFormModel } from '@/types';
import { PROTOCOL_ETHEREUM } from '@/constants';
import { ETH_SYMBOL } from '@/protocols/ethereum/config';

import TransferReviewBase from '@/popup/components/TransferSend/TransferReviewBase.vue';
import DetailsItem from '@/popup/components/DetailsItem.vue';
import TokenAmount from '@/popup/components/TokenAmount.vue';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';

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

    const loading = ref<boolean>(false);

    function openTransactionFailedModal(msg: string) {
      openDefaultModal({
        title: t('modals.transaction-failed.msg'),
        icon: 'critical',
        msg,
      });
    }

    async function transfer({ amount, recipient }: {amount: string, recipient: string}) {
      const ethereumAdapter = ProtocolAdapterFactory.getAdapter(PROTOCOL_ETHEREUM);
      try {
        loading.value = true;
        const { hash } = await ethereumAdapter.spend(
          Number(amount),
          recipient,
          {
            fromAccount: getLastActiveProtocolAccount(PROTOCOL_ETHEREUM),
            maxPriorityFeePerGas: props.transferData.maxPriorityFeePerGas,
            maxFeePerGas: props.transferData.maxFeePerGas,
          },
        );
        return hash;
      } catch (error: any) {
        openTransactionFailedModal(error.message);
        throw error;
      } finally {
        loading.value = false;
      }
    }

    async function submit(): Promise<void> {
      const {
        amount,
        address: recipient,
      } = props.transferData;

      if (!amount || !recipient) {
        return;
      }

      await transfer({
        amount,
        recipient,
      });

      // TODO - redirect after transfer function will be ready
      router.push({ name: homeRouteName.value });
      emit('success');
    }

    return {
      PROTOCOL_ETHEREUM,
      ETH_SYMBOL,
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
