<template>
  <div class="transfer-review-base">
    <ModalHeader
      :title="title"
      :subtitle="withoutSubtitle ? null : subtitle"
      :no-padding="noHeaderPadding"
    >
      <template #title>
        <div v-if="$slots.title">
          <slot name="title" />
        </div>
      </template>
    </ModalHeader>

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
          data-cy="review-amount"
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
      data-cy="review-payload"
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
import { isNameValid } from '@aeternity/aepp-sdk';
import { useAccounts } from '@/composables';
import { AE_CONTRACT_ID } from '@/protocols/aeternity/config';
import { tg } from '@/popup/plugins/i18n';
import type { TransferFormModel, Protocol } from '@/types';

import Loader from '@/popup/components/Loader.vue';
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
    Loader,
    TokenAmount,
  },
  props: {
    title: { type: String, default: tg('pages.send.reviewtx') },
    subtitle: { type: String, default: tg('pages.send.checkalert') },
    senderLabel: { type: String, default: tg('pages.send.sender') },
    amountLabel: { type: String, default: tg('common.amount') },
    baseTokenSymbol: { type: String, required: true },
    transferData: { type: Object as PropType<TransferFormModel>, required: true },
    protocol: { type: String as PropType<Protocol>, required: true },
    recipientAddress: { type: String, default: null },
    avatarName: { type: String, default: null },
    noHeaderPadding: Boolean,
    withoutSubtitle: Boolean,
    loading: Boolean,
    showFiat: Boolean,
  },
  setup(props) {
    const { activeAccount } = useAccounts();

    const isRecipientName = computed(
      () => props.recipientAddress && isNameValid(props.recipientAddress),
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
