<template>
  <flickity
    ref="flickity"
    class="menu-carousel"
    :options="flickityOptions"
  >
    <BoxButton to="/tokens">
      <Balances /> {{ $t('pages.titles.balances') }}
    </BoxButton>
    <BoxButton
      to="/send"
      class="tour__step7"
      data-cy="send"
    >
      <Payments /> {{ $t('pages.titles.payments') }}
    </BoxButton>
    <BoxButton
      to="/tip"
      class="tour__step2"
      data-cy="tip-button"
    >
      <Tips /> {{ $t('pages.titles.tips') }}
    </BoxButton>
    <BoxButton
      to="/transactions"
      class="tour__step5"
    >
      <Activity /> {{ $t('pages.titles.tx-history') }}
    </BoxButton>
    <BoxButton to="/names">
      <Names /> {{ $t('pages.titles.names') }}
    </BoxButton>
    <BoxButton to="/invite">
      <Invites /> {{ $t('pages.titles.invite') }}
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
        draggable: window.IS_MOBILE_DEVICE,
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
@use '../../../styles/variables';
@use '../../../styles/mixins';

.menu-carousel {
  flex: 1;
  z-index: 1;
  padding: 24px 18px;

  ::v-deep {
    .flickity-button {
      width: 24px;
      height: 64px;
      padding: 0;
      background: variables.$color-bg-2;
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
        fill: variables.$color-white;
        opacity: 0.44;
      }

      &:disabled {
        display: none;
      }

      &:hover {
        background: variables.$color-blue-hover-dark;

        .icon {
          opacity: 1;

          path {
            fill: variables.$color-blue;
          }
        }
      }

      &:active {
        background-color: rgba(variables.$color-blue-hover-dark, 0.1);
      }
    }
  }

  .box-button {
    margin-left: 18px;

    @include mixins.mobile {
      margin-left: calc(25% - 88px);
    }

    @media (min-width: variables.$extension-width + 2) and (max-width: 400px) {
      margin-left: calc(33% - 88px);
    }
  }
}
</style>
