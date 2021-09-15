<template>
  <div class="auction-overview">
    <DetailsItem :label="$t('pages.auctionBid.current-highest-bid')">
      <TokenAmount
        slot="value"
        :amount="+getHighestBid(name).nameFee"
      />
    </DetailsItem>
    <DetailsItem
      class="end-height"
      :label="$t('pages.auctionBid.ending-height')"
      :value="auction.expiration"
      :secondary="`(≈${blocksToRelativeTime(blocksToExpiry)})`"
    />
  </div>
</template>

<script>
import { pick } from 'lodash-es';
import { mapGetters } from 'vuex';
import DetailsItem from './DetailsItem';
import TokenAmount from './TokenAmount';
import { blocksToRelativeTime } from '../../../filters/toRelativeTime';

export default {
  components: {
    DetailsItem,
    TokenAmount,
  },
  props: {
    name: { type: String, required: true },
  },
  subscriptions() {
    return pick(this.$store.state.observables, ['topBlockHeight']);
  },
  computed: {
    ...mapGetters('names', ['getAuction', 'getHighestBid']),
    auction() {
      return this.getAuction(this.name);
    },
    blocksToExpiry() {
      return this.auction.expiration - this.topBlockHeight;
    },
  },
  methods: {
    blocksToRelativeTime,
  },
};
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';

.auction-overview {
  display: flex;

  .details-item {
    ::v-deep .label {
      margin-bottom: 4px;
    }

    ::v-deep .value {
      text-align: left;
    }

    &:first-of-type {
      padding-right: 24px;
    }

    &.end-height {
      ::v-deep .value {
        color: variables.$color-light-grey;
      }

      ::v-deep .secondary {
        color: variables.$color-dark-grey;
      }
    }
  }
}
</style>
