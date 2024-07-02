<template>
  <div class="auction-card">
    <BtnHelp
      class="help-button"
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
import BtnHelp from './buttons/BtnHelp.vue';
import AuctionOverview from './AuctionOverview.vue';

export default {
  components: {
    Avatar,
    BtnHelp,
    AuctionOverview,
  },
  props: {
    name: { type: String, required: true },
  },
};
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;
@use '@/styles/typography';

.auction-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 184px;
  background-image: url('../../icons/squares-bg.svg');

  .avatar {
    width: 48px;
    height: 48px;
    box-shadow: rgba($color-primary, 0.15) 0 0 0 8px;
    margin-top: 36px;
  }

  .name {
    @extend %face-sans-14-bold;

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
