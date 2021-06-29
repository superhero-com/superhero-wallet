<template>
  <div class="auction-card">
    <Avatar :name="name" />
    <span class="name">{{ name }}</span>
    <AuctionOverview :name="name" />
    <ButtonPlain
      class="help"
      @click="showHelp"
    >
      <HelpCircle class="icon" />
    </ButtonPlain>
  </div>
</template>

<script>
import Avatar from './Avatar';
import ButtonPlain from './ButtonPlain';
import AuctionOverview from './AuctionOverview';
import HelpCircle from '../../../icons/help-circle.svg?vue-component';
import { blocksToRelativeTime } from '../../../filters/toRelativeTime';

export default {
  components: {
    Avatar,
    ButtonPlain,
    HelpCircle,
    AuctionOverview,
  },
  props: {
    name: { type: String, required: true },
  },
  methods: {
    showHelp() {
      this.$store.dispatch('modals/open', { name: 'help', type: 'auctions' });
    },
    blocksToRelativeTime,
  },
};
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';

.auction-card {
  display: flex;
  flex-direction: column;
  position: relative;
  align-items: center;
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

  .auction-overview {
    margin-top: 16px;
  }

  .help {
    position: absolute;
    right: 16px;
    top: 16px;

    .icon {
      width: 24px;
      height: 24px;
      color: variables.$color-blue;
    }
  }
}
</style>
