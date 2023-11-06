<template>
  <TransferReviewBase
    :base-token-symbol="ETH_SYMBOL"
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
            :symbol="ETH_SYMBOL"
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
import { useAccounts, useModals, useUi } from '@/composables';
import type { TransferFormModel } from '@/types';
import { PROTOCOLS } from '@/constants';
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

      try {
        if (!isSelectedAssetEthCoin.value) {
          ethAdapter.transferToken(
            Number(amount),
            recipient,
            selectedAsset.contractId,
            {
              fromAccount: getLastActiveProtocolAccount(PROTOCOLS.ethereum)?.address,
              maxPriorityFeePerGas: props.transferData.maxPriorityFeePerGas,
              maxFeePerGas: props.transferData.maxFeePerGas,
            },
          );
        } else {
          await ethAdapter.spend(
            Number(amount),
            recipient,
            {
              fromAccount: getLastActiveProtocolAccount(PROTOCOLS.ethereum)?.address,
              maxPriorityFeePerGas: props.transferData.maxPriorityFeePerGas,
              maxFeePerGas: props.transferData.maxFeePerGas,
            },
          );
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
      ETH_SYMBOL,
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
