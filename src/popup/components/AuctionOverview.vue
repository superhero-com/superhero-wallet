<template>
  <div class="auction-overview">
    <DetailsItem :label="$t('pages.auctionBid.current-highest-bid')">
      <template #value>
        <TokenAmount
          :amount="amount"
          :protocol="PROTOCOLS.aeternity"
        />
      </template>
    </DetailsItem>
    <DetailsItem
      class="end-height"
      :label="$t('pages.auctionBid.ending-height')"
      :value="auction.expiration"
      :secondary="`(≈${endHeight})`"
    />
  </div>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue';
import { blocksToRelativeTime } from '@/utils';
import { useTopHeaderData } from '@/composables';
import { PROTOCOLS } from '@/constants';
import { useAeNames } from '@/protocols/aeternity/composables/aeNames';

import DetailsItem from './DetailsItem.vue';
import TokenAmount from './TokenAmount.vue';

export default defineComponent({
  components: {
    DetailsItem,
    TokenAmount,
  },
  props: {
    name: { type: String, required: true },
  },
  setup(props) {
    const { topBlockHeight } = useTopHeaderData();
    const { getNameAuctionHighestBid, getNameAuction } = useAeNames();

    const auction = computed(() => getNameAuction(props.name));

    const blocksToExpiry = computed<number>(() => auction.value.expiration - topBlockHeight.value);
    const amount = computed(() => +getNameAuctionHighestBid(props.name).nameFee);
    const endHeight = computed(() => blocksToRelativeTime(blocksToExpiry.value));

    return {
      PROTOCOLS,
      blocksToRelativeTime,
      auction,
      amount,
      endHeight,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../styles/variables';

.auction-overview {
  display: flex;
  justify-content: space-between;

  .details-item {
    :deep(.label) {
      margin-bottom: 4px;
    }

    :deep(.value) {
      text-align: left;
    }

    &:first-of-type {
      padding-right: 24px;
    }

    &.end-height {
      :deep(.value) {
        color: variables.$color-grey-light;
      }

      :deep(.secondary) {
        color: variables.$color-grey-dark;
      }
    }
  }
}
</style>
