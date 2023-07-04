<template>
  <Component
    :is="to ? 'BtnBase' : 'div'"
    :to="to"
    :disabled="!active"
    :bg-color="color"
    class="account-swiper-slide-card"
  >
    <slot />

    <template v-if="!IS_MOBILE_APP">
      <BtnPlain
        v-if="idx !== 0"
        class="swiper-button prev"
        @click.prevent="$emit('slide', idx - 1)"
      >
        <ChevronIcon />
      </BtnPlain>

      <BtnPlain
        v-if="!hideNext"
        class="swiper-button next"
        @click.prevent="$emit('slide', idx + 1)"
      >
        <ChevronIcon />
      </BtnPlain>
    </template>
  </Component>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from 'vue';
import { RouteLocation } from 'vue-router';

import { getAddressColor } from '@/utils';

import BtnPlain from './buttons/BtnPlain.vue';
import BtnBase from './buttons/BtnBase.vue';
import ChevronIcon from '../../icons/chevron.svg?vue-component';

export default defineComponent({
  components: {
    BtnBase,
    BtnPlain,
    ChevronIcon,
  },
  props: {
    idx: { type: Number, default: -1 },
    address: { type: String, default: '' },
    to: { type: Object as PropType<RouteLocation>, default: null },
    active: Boolean,
    hideNext: Boolean,
  },
  emits: ['slide'],
  setup(props) {
    const color = computed(() => getAddressColor(props.address));

    return {
      color,
      IS_MOBILE_APP: process.env.IS_MOBILE_APP,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../styles/variables' as *;

.account-swiper-slide {
  &-card {
    display: flex;
    border-radius: $border-radius-card;
    color: inherit;
    width: 100%;
    height: 192px;

    .swiper-button {
      position: absolute;
      z-index: 1;
      top: 50%;
      height: 60px;
      width: 30px;
      color: $color-white;
      opacity: 0.5;
      transition: $transition-interactive;

      .icon {
        width: 14px;
        height: 22px;
      }

      &.prev {
        left: 2px;
        transform: translateY(-50%) scaleX(-1);
      }

      &.next {
        right: 2px;
        transform: translateY(-50%);
      }

      &:hover {
        opacity: 1;
      }
    }
  }
}
</style>
