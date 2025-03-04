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
      class="sending-address"
      data-cy="review-sender"
    >
      <template #value>
        <AvatarWithChainName
          :address="activeAccount.address"
          :name="activeAccount.name"
          :show-address="!isRecipientName"
          :protocol="protocol"
        />
      </template>
    </DetailsItem>

    <div v-if="$slots.recipient">
      <slot name="recipient" />
    </div>

    <DetailsItem
      v-else
      class="details-item receiving-addresses"
      data-cy="review-recipient"
      expandable
      :label="`${$t('pages.send.show')} ${transferData.addresses?.length} ${$t('pages.send.recipients')}`"
      :expanded-label="`${$t('pages.send.hide')} ${transferData.addresses?.length} ${$t('pages.send.recipients')}`"
    >
      <template #value>
        <div
          v-for="address in transferData.addresses"
          :key="address"
          class="receiving-address"
        >
          <AvatarWithChainName
            :address="address"
            :name="isNameValid(address) ? address : undefined"
            :show-address="!isNameValid(address)"
            :protocol="protocol"
          />
        </div>
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
          :price="transferData.selectedAsset?.price"
          data-cy="review-amount"
        />
      </template>
    </DetailsItem>

    <DetailsItem
      v-if="recipientsCount > 1"
      :label="multipleAmountLabel"
      class="details-item"
    >
      <template #value>
        <TokenAmount
          :amount="multipleAmount"
          :symbol="tokenSymbol"
          :protocol="protocol"
          :hide-fiat="!showFiat"
          :price="transferData.selectedAsset?.price"
          data-cy="review-amount"
        />
      </template>
    </DetailsItem>

    <slot name="additional-fee" />

    <DetailsItem
      class="details-item"
      :label="feeLabel"
    >
      <template #value>
        <TokenAmount
          :amount="+transferData.fee"
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
    multipleAmountLabel: { type: String, default: tg('pages.send.multipleAccountLabel') },
    feeLabel: { type: String, default: tg('transaction.fee') },
    baseTokenSymbol: { type: String, required: true },
    transferData: { type: Object as PropType<TransferFormModel>, required: true },
    protocol: { type: String as PropType<Protocol>, required: true },
    recipientAddress: { type: String, default: null },
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
    const recipientsCount = computed(() => (props.transferData.addresses?.length || 1));
    const multipleAmount = computed(() => (
      recipientsCount.value > 1 && props.transferData.amount
        ? +props.transferData.amount * recipientsCount.value
        : 0
    ));

    return {
      AE_CONTRACT_ID,
      isRecipientName,
      tokenSymbol,
      activeAccount,
      recipientsCount,
      multipleAmount,
      isNameValid,
    };
  },
});
</script>

<style scoped lang="scss">
@use '@/styles/variables' as *;

.transfer-review-base {
  .sending-address {
    :deep(.value) {
      border-radius: 10px;
      overflow: hidden;
    }
  }

  .details-item {
    margin-top: 16px;

    &.receiving-addresses {
      border-radius: 10px;
      overflow: hidden;

      .receiving-address {
        width: 100%;
        border-radius: 2px;
        background-color: $color-border;
      }

      :deep(.label) {
        width: 100%;
        justify-content: space-between;
        padding: 10px 8px;
        margin: 0;
        background-color: $color-border;
      }

      :deep(.value) {
        margin: 4px 0px 0px 0px;
        padding: 0;
        border: 0;
        background: none;
      }
    }
  }
}
</style>
