<template>
  <div class="menu-carousel">
    <button class="prev" ref="prev" @click="calcTransform(1)"><Arrow /></button>
    <div class="viewport" ref="viewport">
      <div class="content" ref="content">
        <BoxButton to="/tokens" :text="$t('pages.titles.balances')">
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
        <BoxButton to="/transactions" :text="$t('pages.titles.tx-history')" class="tour__step5">
          <Activity slot="icon" />
        </BoxButton>
        <BoxButton to="/names" :text="$t('pages.titles.names')" class="cell">
          <Names slot="icon" />
        </BoxButton>
        <BoxButton to="/invite" :text="$t('pages.titles.invite')">
          <Invites slot="icon" />
        </BoxButton>
      </div>
    </div>
    <button class="next" ref="next" @click="calcTransform(-1)"><Arrow /></button>
  </div>
</template>

<script>
import BoxButton from './BoxButton';
import Arrow from '../../../icons/chevron-next.svg?vue-component';
import Balances from '../../../icons/balances.svg?vue-component';
import Payments from '../../../icons/payments.svg?vue-component';
import Tips from '../../../icons/tips.svg?vue-component';
import Activity from '../../../icons/activity.svg?vue-component';
import Names from '../../../icons/names.svg?vue-component';
import Invites from '../../../icons/invites.svg?vue-component';

export default {
  name: 'MenuCarousel',
  components: {
    BoxButton,
    Arrow,
    Balances,
    Payments,
    Tips,
    Activity,
    Names,
    Invites,
  },
  methods: {
    calcTransform(direction) {
      const transform = +/translateX\((-?[0-9]+)px\)/.exec(this.$refs.content.style.transform)[1];
      const viewportWidth = this.$refs.viewport.offsetWidth;

      const delta = transform + viewportWidth * direction;
      const showPrev = delta < 0;
      const showNext = delta >= -(this.$refs.content.offsetWidth - viewportWidth);

      this.$refs.prev.style.display = showPrev ? 'inline-block' : 'none';
      this.$refs.viewport.style.marginLeft = showPrev ? '0' : '16px';
      this.$refs.next.style.display = showNext ? 'inline-block' : 'none';
      this.$refs.viewport.style.marginRight = showNext ? '0' : '16px';
      this.$refs.content.style.transform = `translateX(${delta}px)`;
    },
  },
  mounted() {
    this.$refs.prev.style.display = 'none';
    this.$refs.viewport.style.marginLeft = '16px';
    this.$refs.content.style.transform = 'translateX(0)';
  },
};
</script>

<style lang="scss" scoped>
@import '../../../styles/mixins';

.menu-carousel {
  display: flex;
  padding: 24px 0;

  .viewport {
    overflow: hidden;
    width: calc(100% - 48px);

    .content {
      display: flex;
      white-space: nowrap;
      transition-property: transform;
      transition-duration: 0.5s;

      .box-button {
        display: inline-flex;
        justify-content: center;
        flex: 0 0 auto;
        width: 104px;

        @include mobile {
          width: 25%;
        }

        @media (min-width: $extension-width + 2) and (max-width: 400px) {
          width: 33%;
        }
      }
    }
  }

  .prev,
  .next {
    flex: 0 0 auto;
    width: 24px;
    height: 64px;
    padding: 0;
    background: $color-bg-2;
    border-radius: 6px 0 0 6px;
    cursor: pointer;

    svg {
      opacity: 0.44;
    }

    &:hover {
      background: $color-blue-alpha-15;
    }

    &:active {
      background-color: rgba($color-blue-alpha-15, 0.1);
    }
  }

  .prev {
    margin-right: 8px;
    transform: rotate(-180deg);
  }

  .next {
    margin-left: 8px;
  }
}
</style>
