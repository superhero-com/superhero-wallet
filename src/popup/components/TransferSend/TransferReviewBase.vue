<template>
  <div class="transfer-review-base">
    <ModalHeader
      :title="title"
      :subtitle="withoutSubtitle ? null : $t('pages.send.checkalert')"
    />

    <slot name="subheader" />

    <DetailsItem
      :label="senderLabel"
      data-cy="review-sender"
    >
      <template #value>
        <AvatarWithChainName
          :address="activeAccount.address"
          :name="activeAccount.name"
          :show-address="!isRecipientName"
        />
      </template>
    </DetailsItem>

    <div v-if="$slots.recipient">
      <slot name="recipient" />
    </div>

    <DetailsItem
      v-else
      class="details-item"
      data-cy="review-recipient"
      :label="$t('pages.send.recipient')"
    >
      <template #value>
        <AvatarWithChainName
          :address="transferData.address"
          :name="avatarName"
          :show-address="!avatarName"
        />
      </template>
    </DetailsItem>

    <DetailsItem
      :label="amountLabel"
      class="details-item"
    >
      <template #value>
        <TokenAmount
          :amount="+transferData.amount"
          :symbol="tokenSymbol"
          :protocol="protocol"
          :hide-fiat="!showFiat"
        />
      </template>
    </DetailsItem>

    <slot name="additional-fee" />

    <DetailsItem
      class="details-item"
      :label="$t('transaction.fee')"
    >
      <template #value>
        <TokenAmount
          :amount="+transferData.fee.toFixed()"
          :symbol="baseTokenSymbol"
          :protocol="protocol"
          high-precision
          data-cy="review-fee"
        />
      </template>
    </DetailsItem>

    <slot name="total" />

    <PayloadDetails
      class="details-item"
      :payload="transferData.payload"
    />

    <Loader v-if="loading" />
  </div>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  PropType,
} from 'vue';
import {
  useAccounts,
} from '@/composables';
import {
  AE_CONTRACT_ID,
} from '@/protocols/aeternity/config';
import { isAensNameValid } from '@/protocols/aeternity/helpers';
import { tg } from '@/popup/plugins/i18n';
import type { TransferFormModel, Protocol } from '@/types';

import DetailsItem from '../DetailsItem.vue';
import TokenAmount from '../TokenAmount.vue';
import AvatarWithChainName from '../AvatarWithChainName.vue';
import ModalHeader from '../ModalHeader.vue';
import PayloadDetails from '../PayloadDetails.vue';

export default defineComponent({
  name: 'TransferReviewBase',
  components: {
    PayloadDetails,
    ModalHeader,
    AvatarWithChainName,
    DetailsItem,
    TokenAmount,
  },
  props: {
    title: { type: String, default: tg('pages.send.reviewtx') },
    senderLabel: { type: String, default: tg('pages.send.sender') },
    amountLabel: { type: String, default: tg('common.amount') },
    baseTokenSymbol: { type: String, required: true },
    transferData: { type: Object as PropType<TransferFormModel>, required: true },
    protocol: { type: String as PropType<Protocol>, required: true },
    recipientAddress: { type: String, default: null },
    avatarName: { type: String, default: null },
    withoutSubtitle: Boolean,
    loading: Boolean,
    showFiat: Boolean,
  },
  setup(props) {
    const { activeAccount } = useAccounts();

    const isRecipientName = computed(
      () => props.recipientAddress && isAensNameValid(props.recipientAddress),
    );

    const tokenSymbol = computed(() => props.transferData.selectedAsset?.symbol || '-');

    return {
      AE_CONTRACT_ID,
      isRecipientName,
      tokenSymbol,
      activeAccount,
    };
  },
});
</script>

<style scoped lang="scss">
.transfer-review-base {
  .details-item {
    margin-top: 16px;
  }
}
</style>
