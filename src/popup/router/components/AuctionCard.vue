<template>
  <div class="auction-card">
    <HelpButton
      :title="$t('modals.auctions-help.title')"
      :msg="$t('modals.auctions-help.msg')"
    />
    <Avatar :name="name" />
    <span class="name">{{ name }}</span>
    <AuctionOverview :name="name" />
  </div>
</template>

<script>
import Avatar from './Avatar.vue';
import HelpButton from './HelpButton.vue';
import AuctionOverview from './AuctionOverview.vue';
import { blocksToRelativeTime } from '../../../filters/toRelativeTime';

export default {
  components: {
    Avatar,
    HelpButton,
    AuctionOverview,
  },
  props: {
    name: { type: String, required: true },
  },
  methods: {
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

  .help-button {
    align-self: flex-end;
    padding-top: 16px;
    padding-right: 16px;
    margin-bottom: -36px;
  }
}
</style>
