<template>
  <div class="tab-bar">
    <RouterLink to="/account">
      <Home />
    </RouterLink>
    <RouterLink v-if="UNFINISHED_FEATURES" to="/tokens">
      <Balances />
    </RouterLink>
    <RouterLink to="/payments">
      <Payments />
    </RouterLink>
    <RouterLink to="/tips">
      <Tips />
    </RouterLink>
    <RouterLink to="/settings">
      <Settings />
    </RouterLink>
  </div>
</template>

<script>
import Home from '../../../icons/sidebar-menu/home.svg?vue-component';
import Balances from '../../../icons/sidebar-menu/balances.svg?vue-component';
import Payments from '../../../icons/sidebar-menu/payments.svg?vue-component';
import Tips from '../../../icons/sidebar-menu/tips.svg?vue-component';
import Settings from '../../../icons/settings.svg?vue-component';

export default {
  components: {
    Home, Balances, Payments, Tips, Settings,
  },
  data: () => ({
    UNFINISHED_FEATURES: process.env.UNFINISHED_FEATURES,
  }),
};
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';
@use '../../../styles/mixins';

.tab-bar {
  display: flex;
  background-color: variables.$color-bg-3;
  border-bottom: env(safe-area-inset-bottom) solid variables.$color-bg-2;

  > a {
    $sideBorderWidth: calc(1px - min(env(safe-area-inset-bottom), 1px));

    height: 48px;
    display: flex;
    flex: 1 0;
    justify-content: center;
    align-items: center;
    border-radius: 2px 2px 0 0;
    background-color: variables.$color-bg-2;
    margin: 1px 1px $sideBorderWidth;
    color: variables.$color-white;

    &:first-child {
      margin-left: $sideBorderWidth;

      @include mixins.desktop {
        border-bottom-left-radius: 10px;
      }
    }

    &:last-child {
      margin-right: $sideBorderWidth;

      @include mixins.desktop {
        border-bottom-right-radius: 10px;
      }
    }

    &:hover {
      background-color: variables.$color-hover;
    }

    &:active {
      background-color: variables.$color-bg-1;
    }

    svg {
      width: 24px;
      height: 24px;
      opacity: 0.7;
    }

    &.router-link-active {
      color: variables.$color-blue;

      &,
      &:hover,
      &:active {
        background-color: variables.$color-bg-1;

        svg {
          opacity: 1;
        }
      }
    }
  }
}
</style>
