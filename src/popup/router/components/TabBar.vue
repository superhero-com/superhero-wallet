<template>
  <div class="tab-bar">
    <RouterLink to="/account">
      <Home />
      <span>{{ $t('pages.titles.home') }}</span>
    </RouterLink>
    <RouterLink to="/balances">
      <Balances />
      <span>{{ $t('pages.titles.balances') }}</span>
    </RouterLink>
    <RouterLink
      to="/transfer"
      data-cy="send"
    >
      <Transfer />
      <span>{{ $t('pages.titles.transfer') }}</span>
    </RouterLink>
    <RouterLink
      to="/tips"
      data-cy="tip-button"
    >
      <Tips />
      <span>{{ $t('pages.titles.tips') }}</span>
    </RouterLink>
    <RouterLink :to="{name: 'name-list' }">
      <Names />
      <span>{{ $t('pages.titles.names') }}</span>
    </RouterLink>
  </div>
</template>

<script>
import Home from '../../../icons/home.svg?vue-component';
import Balances from '../../../icons/balances.svg?vue-component';
import Transfer from '../../../icons/transfer.svg?vue-component';
import Tips from '../../../icons/tips.svg?vue-component';
import Names from '../../../icons/names.svg?vue-component';

export default {
  components: {
    Home, Balances, Transfer, Tips, Names,
  },
};
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';
@use '../../../styles/typography';
@use '../../../styles/mixins';

.tab-bar {
  display: flex;
  background-color: variables.$color-bg-3;
  border-bottom: env(safe-area-inset-bottom) solid variables.$color-bg-2;

  > a {
    $sideBorderWidth: calc(1px - min(env(safe-area-inset-bottom), 1px));

    height: 48px;
    display: flex;
    flex-direction: column;
    flex: 1 0;
    justify-content: center;
    align-items: center;
    border-radius: 2px 2px 0 0;
    background-color: variables.$color-bg-2;
    margin: 1px 1px $sideBorderWidth;
    color: variables.$color-white;
    text-decoration: none;

    @extend %face-sans-12-medium;

    &:not(.router-link-active) span {
      color: variables.$color-dark-grey;
    }

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

    &:not(:active):hover {
      background-color: variables.$color-hover;

      &:not(.router-link-active) span {
        color: variables.$color-light-grey;
      }

      svg {
        opacity: 1;
      }
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
