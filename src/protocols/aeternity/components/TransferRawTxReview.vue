<template>
  <Loader v-if="!transferData" />
  <div
    v-else
    class="transfer-raw-tx-review"
  >
    <ModalHeader
      title="Review and send transaction"
    />

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
          :amount="+transferData.amount"
          :symbol="AETERNITY_SYMBOL"
        />
      </template>
    </DetailsItem>

    <DetailsItem
      class="details-item"
      :label="$t('transaction.fee')"
    >
      <template #value>
        <TokenAmount
          :amount="+transferData.fee"
          :symbol="AETERNITY_SYMBOL"
          high-precision
          data-cy="review-fee"
        />
      </template>
    </DetailsItem>

    <DetailsItem
      :label="$t('pages.signTransaction.total')"
      class="details-item"
    >
      <template #value>
        <TokenAmount
          :amount="+transferData.total"
          :symbol="AETERNITY_SYMBOL"
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
} from '@vue/composition-api';
import { TxBuilder } from '@aeternity/aepp-sdk';
import BigNumber from 'bignumber.js';
import { useGetter } from '../../composables/vuex';
import { useModals } from '../../composables';
import {
  AETERNITY_CONTRACT_ID,
  AETERNITY_SYMBOL,
  MODAL_DEFAULT,
  aettosToAe,
  MODAL_SPEND_SUCCESS,
} from '../utils';
import { ISdk } from '../../types';
import DetailsItem from './DetailsItem.vue';
import TokenAmount from './TokenAmount.vue';
import AvatarWithChainName from './AvatarWithChainName.vue';
import ModalHeader from './ModalHeader.vue';
import { TransferFormModel } from './Modals/TransferSend.vue';

export default defineComponent({
  name: 'TransferRawTxReview',
  components: {
    ModalHeader,
    AvatarWithChainName,
    DetailsItem,
    TokenAmount,
  },
  props: {
    txRaw: { type: String, required: true },
  },
  setup(props, { root, emit }) {
    const { openModal } = useModals();

    const transferData = ref<TransferFormModel>();
    const loading = ref<boolean>(true);
    const sdk = useGetter<ISdk>('sdkPlugin/sdk');
    const recipientId = ref();
    const senderId = ref();

    async function submit() {
      emit('success');
      try {
        const transaction = await sdk.value.sendTransaction(props.txRaw, {
          waitMined: true,
        });
        openModal(MODAL_SPEND_SUCCESS, {
          transaction,
        });
      } catch (error) {
        openModal(MODAL_DEFAULT, {
          title: root.$t('modals.transaction-failed.msg'),
          icon: 'critical',
        });
      }
    }

    onMounted(() => {
      const { tx } = TxBuilder.unpackTx(props.txRaw).tx.encodedTx;
      if (!tx) return;
      recipientId.value = tx.recipientId;
      senderId.value = tx.senderId;
      transferData.value = {
        amount: aettosToAe(tx?.amount || 0).toString(),
        fee: aettosToAe(tx?.fee || 0),
        total: new BigNumber(aettosToAe(tx?.fee || 0)).plus(
          new BigNumber(aettosToAe(tx?.amount || 0)),
        ).toNumber(),
        payload: tx.payload,
      };
    });

    return {
      AETERNITY_SYMBOL,
      AETERNITY_CONTRACT_ID,
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
