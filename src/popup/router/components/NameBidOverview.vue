<template>
  <div class="name-bid-overview">
    <Avatar :name="name" />
    <span class="name">{{ name }}</span>
    <div class="details">
      <DetailsItem :label="$t('pages.auctionBid.current-highest-bid')">
        <TokenAmount
          slot="value"
          :amount="highestBid"
        />
      </DetailsItem>
      <DetailsItem
        class="height"
        :label="$t('pages.auctionBid.ending-height')"
        :value="endHeight"
        :secondary="`(≈${blocksToRelativeTime(endHeight)})`"
      />
    </div>
    <button
      class="help"
      @click="showHelp"
    >
      <HelpCircle class="icon" />
    </button>
  </div>
</template>

<script>
import Avatar from './Avatar';
import DetailsItem from './DetailsItem';
import TokenAmount from './TokenAmount';
import HelpCircle from '../../../icons/help-circle.svg?vue-component';
import { blocksToRelativeTime } from '../../../filters/toRelativeTime';

export default {
  components: {
    Avatar,
    DetailsItem,
    TokenAmount,
    HelpCircle,
  },
  props: {
    name: { type: String, required: true },
    highestBid: { type: Number, required: true },
    endHeight: { type: Number, required: true },
  },
  methods: {
    showHelp() {
      // TODO: show auctions and bidding modal
    },
    blocksToRelativeTime,
  },
};
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';
@use '../../../styles/typography';

.name-bid-overview {
  display: flex;
  flex-direction: column;
  position: relative;
  align-items: center;
  width: variables.$extension-width;
  height: 184px;
  background-image: url('../../../icons/squares-bg.svg');

  .avatar {
    width: 48px;
    height: 48px;
    box-shadow: rgba(variables.$color-blue, 0.15) 0 0 0 8px;
    margin-top: 36px;
  }

  .name {
    font-weight: bold;
    font-size: 14px;
    line-height: 16px;
    margin-top: 16px;
  }

  .details {
    display: flex;
    margin-top: 16px;

    .details-item {
      padding: 0 12px;

      ::v-deep .label {
        margin-bottom: 4px;
      }

      ::v-deep .value {
        text-align: left;
      }

      &.height {
        ::v-deep .value {
          color: variables.$color-light-grey;
        }

        ::v-deep .secondary {
          color: variables.$color-dark-grey;
        }
      }
    }
  }

  .help {
    position: absolute;
    right: 16px;
    top: 16px;
    // TODO: use PlainButton
    padding: 0;
    cursor: pointer;

    .icon {
      width: 24px;
      height: 24px;
      color: variables.$color-blue;
    }
  }
}
</style>
