<template>
  <div>
    <div class="tabs">
      <ButtonPlain
        :to="{ name: 'account-details-names' }"
        :text="$t('pages.names.tabs.my-names')"
        exact
      />
      <ButtonPlain
        :to="{ name: 'account-details-names-auctions' }"
        :text="$t('pages.names.tabs.auctions')"
      />

      <ButtonPlain
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
import ButtonPlain from '../components/ButtonPlain.vue';

export default {
  components: {
    ButtonPlain,
  },
};
</script>
<style lang="scss" scoped>
  @use '../../../styles/variables';
  @use '../../../styles/mixins';
  @use '../../../styles/typography';

  .tabs {
    gap: 16px;
    padding-left: 4px;
    padding-right: 4px;
    border-radius: 14px;
    padding-top: 2px;
    background-color: var(--screen-bg-color);
    margin-bottom: 10px;

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
</style>
