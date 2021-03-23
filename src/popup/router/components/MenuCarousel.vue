<template>
  <div class="menu-carousel">
    <flickity class="carousel" ref="flickity" :options="flickityOptions">
      <BoxButton to="/tokens" :text="$t('pages.titles.balances')">
        <Balances slot="icon" />
      </BoxButton>
      <BoxButton to="/send" :text="$t('pages.titles.payments')" class="tour__step7" data-cy="send">
        <Payments slot="icon" />
      </BoxButton>
      <BoxButton to="/tip" :text="$t('pages.titles.tips')" class="tour__step2" data-cy="tip-button">
        <Tips slot="icon" />
      </BoxButton>
      <BoxButton to="/transactions" :text="$t('pages.titles.tx-history')" class="tour__step5">
        <Activity slot="icon" />
      </BoxButton>
      <BoxButton to="/names" :text="$t('pages.titles.names')" class="cell">
        <Names slot="icon" />
      </BoxButton>
      <BoxButton to="/invite" :text="$t('pages.titles.invite')">
        <Invites slot="icon" />
      </BoxButton>
    </flickity>
    <div class="navigation">
      <button v-show="!hasMore" @click="previous" class="button">
        <Arrow class="icon" />
      </button>
      <button v-show="hasMore" @click="next" class="button">
        <Arrow class="icon" />
      </button>
    </div>
  </div>
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
import Arrow from '../../../icons/chevron-next.svg?vue-component';

export default {
  name: 'MenuCarousel',
  components: {
    Flickity,
    BoxButton,
    Arrow,
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
        prevNextButtons: false,
        pageDots: false,
        freeScroll: false,
        draggable: process.env.PLATFORM === 'cordova',
        groupCells: 3,
        contain: true,
        selectedAttraction: 0.15,
        friction: 1,
        cellAlign: 'left',
      },
      hasMore: false,
    };
  },
  methods: {
    next() {
      this.$refs.flickity.next();
    },
    previous() {
      this.$refs.flickity.previous();
    },
  },
  mounted() {
    this.hasMore = this.$refs.flickity.slides().length > 0;
    this.$refs.flickity.flickity().on('change', (index) => {
      this.hasMore = index < this.$refs.flickity.slides().length - 1;
    });
  },
};
</script>

<style lang="scss" scoped>
@import '../../../styles/variables';

.menu-carousel {
  position: relative;
  display: flex;
  justify-content: center;

  .carousel {
    flex: 1;
    z-index: 1;

    .box-button {
      padding-right: 16px;

      &:nth-of-type(4) {
        padding-left: 16px;
      }
    }
  }

  .navigation {
    position: absolute;
    top: 0;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;

    .button {
      width: 24px;
      height: 64px;
      padding: 0;
      background: $color-bg-2;
      border-radius: 6px 0 0 6px;
      cursor: pointer;

      &:nth-child(1) {
        transform: rotate(-180deg);
      }

      &:nth-child(2) {
        align-self: flex-end;
      }

      .icon {
        width: 24px;
        height: 24px;
        opacity: 0.44;
      }

      &:hover {
        background: $color-blue-alpha-15;

        .icon {
          opacity: 1;

          path {
            fill: $color-blue;
          }
        }
      }

      &:active {
        background-color: rgba($color-blue-alpha-15, 0.1);
      }
    }
  }
}
</style>
