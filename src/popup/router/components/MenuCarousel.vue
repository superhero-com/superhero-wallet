<template>
  <flickity
    ref="flickity"
    class="menu-carousel"
    :options="flickityOptions"
  >
    <BoxButton
      to="/tokens"
      :text="$t('pages.titles.balances')"
    >
      <Balances slot="icon" />
    </BoxButton>
    <BoxButton
      to="/send"
      :text="$t('pages.titles.payments')"
      class="tour__step7"
      data-cy="send"
    >
      <Payments slot="icon" />
    </BoxButton>
    <BoxButton
      to="/tip"
      :text="$t('pages.titles.tips')"
      class="tour__step2"
      data-cy="tip-button"
    >
      <Tips slot="icon" />
    </BoxButton>
    <BoxButton
      to="/transactions"
      :text="$t('pages.titles.tx-history')"
      class="tour__step5"
    >
      <Activity slot="icon" />
    </BoxButton>
    <BoxButton
      to="/names"
      :text="$t('pages.titles.names')"
      class="cell"
    >
      <Names slot="icon" />
    </BoxButton>
    <BoxButton
      to="/invite"
      :text="$t('pages.titles.invite')"
    >
      <Invites slot="icon" />
    </BoxButton>
  </flickity>
</template>

<script>
import Flickity from 'vue-flickity';
import BoxButton from './BoxButton';
import Balances from '../../../icons/balances.svg?vue-component';
import Payments from '../../../icons/payments.svg?vue-component';
import Tips from '../../../icons/tips.svg?vue-component';
import Activity from '../../../icons/activity.svg?vue-component';
import Names from '../../../icons/names.svg?vue-component';
import Invites from '../../../icons/invites.svg?vue-component';

export default {
  name: 'MenuCarousel',
  components: {
    Flickity,
    BoxButton,
    Balances,
    Payments,
    Tips,
    Activity,
    Names,
    Invites,
  },
  data() {
    return {
      flickityOptions: {
        initialIndex: 0,
        prevNextButtons: true,
        pageDots: false,
        freeScroll: false,
        draggable: process.env.PLATFORM === 'cordova',
        groupCells: 3,
        contain: true,
        selectedAttraction: 0.15,
        friction: 1,
        cellAlign: 'left',
      },
    };
  },
};
</script>

<style lang="scss" scoped>
@import '../../../styles/mixins';

.menu-carousel {
  flex: 1;
  z-index: 1;
  padding: 24px 12px;

  ::v-deep {
    .flickity-slider {
      @include mobile {
        width: 97%;
      }
    }

    .flickity-button {
      width: 24px;
      height: 64px;
      padding: 0;
      background: #171717;
      cursor: pointer;

      &.previous {
        left: 0;
        border-radius: 0 6px 6px 0;
      }

      &.next {
        left: calc(100% - 24px);
        border-radius: 6px 0 0 6px;
      }

      .flickity-button-icon {
        fill: $color-white;
        opacity: 0.44;
      }

      &:disabled {
        display: none;
      }

      &:hover {
        background: $color-blue-hover-dark;

        .icon {
          opacity: 1;

          path {
            fill: $color-blue;
          }
        }
      }

      &:active {
        background-color: rgba($color-blue-hover-dark, 0.1);
      }
    }
  }

  .box-button {
    display: flex;
    justify-content: center;
    width: 104px;

    @include mobile {
      width: 25%;
    }

    @media (min-width: $extension-width + 2) and (max-width: 400px) {
      width: 33%;
    }
  }
}
</style>
