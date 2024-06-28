<template>
  <div class="auction-card">
    <div class="inner">
      <div class="header">
        <span class="name">{{ name }}</span>
        <BtnHelp
          class="help-button"
          :title="$t('modals.auctions-help.title')"
          :msg="$t('modals.auctions-help.msg')"
        />
      </div>

      <AuctionOverview
        :name="name"
        class="overview"
      />
    </div>
  </div>
</template>

<script>
import BtnHelp from './buttons/BtnHelp.vue';
import AuctionOverview from './AuctionOverview.vue';

export default {
  components: {
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
  align-items: center;
  justify-content: center;
  height: 184px;
  padding-inline: var(--screen-padding-x);
  background-image: url('../../icons/squares-bg.svg');

  .inner {
    display: flex;
    flex-direction: column;
    width: 100%;
  }

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .name {
    @extend %face-sans-16-semi-bold;

    line-height: 16px;
    margin-top: 16px;
  }

  .overview {
    width: 100%;
    margin-top: 16px;
  }

  .help-button {
    align-self: flex-end;
    padding-top: 16px;
  }
}
</style>
