<template>
  <div class="tab-bar">
    <RouterLink to="/account">
      <Home />
    </RouterLink>
    <RouterLink to="/tokens">
      <Balances />
    </RouterLink>
    <RouterLink to="/send">
      <Payments />
    </RouterLink>
    <RouterLink to="/tip">
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
  components: { Home, Balances, Payments, Tips, Settings },
};
</script>

<style lang="scss" scoped>
@import '../../../styles/variables';

.tab-bar {
  display: flex;
  background-color: $color-bg-3;

  > a {
    height: 48px;
    display: flex;
    flex-grow: 1;
    justify-content: center;
    align-items: center;
    border-radius: 2px 2px 0 0;
    background-color: $color-bg-2;
    border: 1px solid $color-bg-3;
    color: $color-white;

    svg {
      width: 24px;
      height: 24px;
      opacity: 0.7;
    }

    &.router-link-active {
      background-color: $color-bg-1;
      color: $color-blue;
    }

    &.router-link-active,
    &:hover:not(.router-link-active),
    &:active:not(.router-link-active) {
      svg {
        opacity: 1;
      }
    }

    &:hover:not(.router-link-active) {
      background-color: $color-hover;
    }

    &:active:not(.router-link-active) {
      background-color: $color-bg-1;
    }
  }
}
</style>
