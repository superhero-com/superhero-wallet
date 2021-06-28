<template>
  <div class="auction-history">
    <span class="title">
      {{ $t('pages.names.auctions.bids-on') }}
      <span class="name">{{ name }}</span>
    </span>
    <div class="item">
      <AccountItem
        :address="highestBid.accountId"
        :name="getPreferred(highestBid.accountId)"
      />
      <AuctionOverview :name="name" />
    </div>
    <div
      v-for="(bid, index) in previousBids"
      :key="index"
      class="item"
    >
      <TokenAmount :amount="+bid.nameFee" />
      <AccountItem
        :address="bid.accountId"
        :name="getPreferred(bid.accountId)"
      />
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import AccountItem from '../../components/AccountItem';
import AuctionOverview from '../../components/AuctionOverview';
import TokenAmount from '../../components/TokenAmount';

export default {
  components: { AccountItem, AuctionOverview, TokenAmount },
  props: {
    name: { type: String, required: true },
  },
  computed: {
    ...mapGetters('names', ['getAuction', 'getHighestBid', 'getPreferred']),
    highestBid() {
      return this.getHighestBid(this.name);
    },
    previousBids() {
      return this.getAuction(this.name).bids
        .filter((bid) => bid !== this.highestBid);
    },
  },
};
</script>

<style lang="scss" scoped>
@use '../../../../styles/variables';
@use '../../../../styles/typography';

.auction-history {
  min-height: 184px;
  background-image: url('../../../../icons/squares-bg.svg');
  background-repeat: repeat-x;

  .title {
    padding: 16px 0 8px 0;
    text-align: center;
    color: variables.$color-dark-grey;
    display: block;

    @extend %face-sans-17-medium;

    .name {
      color: variables.$color-blue;
    }
  }

  .item {
    margin: 0 16px;
    padding: 8px 0;

    &:not(:first-of-type) {
      border-top: 1px solid rgba(variables.$color-blue, 0.44);
    }

    .account-item {
      margin-top: 4px;
    }

    .auction-overview {
      margin-top: 16px;

      ::v-deep .details-item:first-of-type {
        padding-right: 32px;
      }
    }
  }
}
</style>
