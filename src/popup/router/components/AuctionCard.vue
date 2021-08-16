<template>
  <div class="auction-card">
    <ButtonPlain
      class="help"
      @click="showHelp"
    >
      <QuestionCircle class="icon" />
    </ButtonPlain>
    <Avatar :name="name" />
    <span class="name">{{ name }}</span>
    <AuctionOverview :name="name" />
  </div>
</template>

<script>
import Avatar from './Avatar';
import ButtonPlain from './ButtonPlain';
import AuctionOverview from './AuctionOverview';
import QuestionCircle from '../../../icons/question-circle-border.svg?vue-component';
import { blocksToRelativeTime } from '../../../filters/toRelativeTime';

export default {
  components: {
    Avatar,
    ButtonPlain,
    QuestionCircle,
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
    align-self: flex-end;
    padding-top: 16px;
    padding-right: 16px;
    margin-bottom: -36px;

    .icon {
      width: 24px;
      height: 24px;
      color: rgba(variables.$color-blue, 0.7);
    }
  }
}
</style>
