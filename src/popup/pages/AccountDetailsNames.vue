<template>
  <div class="account-details-names">
    <div class="tabs">
      <BtnPlain
        :to="{ name: 'account-details-names' }"
        :text="$t('pages.names.tabs.my-names')"
        exact
      />
      <BtnPlain
        :to="{ name: 'account-details-names-auctions' }"
        :text="$t('pages.names.tabs.auctions')"
      />
      <BtnPlain
        :to="{ name: 'account-details-names-claim' }"
        :text="$t('pages.names.tabs.register')"
      />
    </div>
    <transition
      name="fade-transition"
      mode="out-in"
    >
      <RouterView />
    </transition>
  </div>
</template>

<script>
import BtnPlain from '../components/buttons/BtnPlain.vue';

export default {
  components: {
    BtnPlain,
  },
};
</script>

<style lang="scss" scoped>
@use '../../styles/variables';
@use '../../styles/mixins';
@use '../../styles/typography';

.account-details-names {
  --header-height: 126px;

  .tabs {
    position: sticky;
    top: calc(var(--header-height) + env(safe-area-inset-top));
    z-index: 2;
    gap: var(--gap);
    padding-top: 2px;
    padding-bottom: 10px;
    background-color: var(--screen-bg-color);

    @include mixins.flex(flex-start, center, row);

    .button-plain {
      padding: 2px 10px;
      gap: 4px;
      border-radius: 20px;
      background-color: rgba(variables.$color-white, 0.08);
      color: rgba(variables.$color-white, 0.5);

      @extend %face-sans-14-regular;

      @include mixins.flex(center, center, row);

      &.router-link-active {
        background-color: rgba(variables.$color-white, 0.15);
        color: variables.$color-white;
      }
    }
  }
}
</style>
