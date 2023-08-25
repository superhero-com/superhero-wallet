<template>
  <TransferReviewBase
    :base-token-symbol="BTC_SYMBOL"
    :transfer-data="transferData"
    :loading="loading"
    show-fiat
    :protocol="PROTOCOL_BITCOIN"
    class="transfer-review"
  >
    <template #total>
      <DetailsItem
        :label="$t('common.total')"
        class="details-item"
      >
        <template #value>
          <TokenAmount
            :amount="+transferData.total"
            :symbol="BTC_SYMBOL"
            high-precision
            :protocol="PROTOCOL_BITCOIN"
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
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAccounts, useModals, useUi } from '@/composables';
import type { TransferFormModel } from '@/types';
import { PROTOCOL_BITCOIN } from '@/constants';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';

import TransferReviewBase from '@/popup/components/TransferSend/TransferReviewBase.vue';
import DetailsItem from '@/popup/components/DetailsItem.vue';
import TokenAmount from '@/popup/components/TokenAmount.vue';
import { BTC_SYMBOL, BTC_CONTRACT_ID } from '@/protocols/bitcoin/config';
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

    const store = useStore();
    const { activeAccount } = useAccounts({ store });

    const loading = ref<boolean>(false);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    function openTransactionFailedModal() {
      openDefaultModal({
        title: t('modals.transaction-failed.msg'),
        icon: 'critical',
      });
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async function transfer({ amount, recipient, selectedAsset }: any) {
      const bitcoinAdapter = ProtocolAdapterFactory.getAdapter(PROTOCOL_BITCOIN);
      try {
        loading.value = true;
        const { hash } = await bitcoinAdapter.spend(BigNumber(amount).toNumber(), recipient, {
          fee: props.transferData.fee?.toNumber(),
          ...activeAccount.value,
        });
        return hash;
      } catch (error) {
        openTransactionFailedModal();
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
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const hash = await transfer({
        amount,
        recipient,
        selectedAsset,
      });

      // TODO - redirect after transfer function will be ready
      router.push({ name: homeRouteName.value });
      emit('success');
    }

    return {
      PROTOCOL_BITCOIN,
      BTC_SYMBOL,
      BTC_CONTRACT_ID,
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
