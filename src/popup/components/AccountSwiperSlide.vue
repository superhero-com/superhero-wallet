<template>
  <swiper-slide>
    <slot />
    <BtnPlain
      v-if="idx !== 0 && !IS_CORDOVA"
      class="swiper-button prev"
      @click="$emit('slide', idx - 1)"
    >
      <ChevronIcon />
    </BtnPlain>
    <BtnPlain
      v-if="!IS_CORDOVA && !hideNext"
      class="swiper-button next"
      @click="$emit('slide', idx + 1)"
    >
      <ChevronIcon />
    </BtnPlain>
  </swiper-slide>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';
import { SwiperSlide } from 'vue-awesome-swiper';
import BtnPlain from './buttons/BtnPlain.vue';
import ChevronIcon from '../../icons/chevron.svg?vue-component';

export default defineComponent({
  components: {
    SwiperSlide,
    BtnPlain,
    ChevronIcon,
  },
  props: {
    idx: { type: Number, default: -1 },
    hideNext: Boolean,
  },
  setup() {
    return {
      IS_CORDOVA: process.env.IS_CORDOVA,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../styles/variables' as *;

.swiper-button {
  position: absolute;
  z-index: 1;
  top: 50%;
  height: 60px;
  width: 30px;
  color: $color-white;
  opacity: 0.5;
  transition: $transition-interactive;

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
</style>
