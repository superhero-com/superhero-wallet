<template>
  <div
    ref="el"
    class="back-to-top"
    :class="{ sticky, visible: isVisible }"
  >
    <transition name="fade-transition">
      <div
        v-if="isVisible"
        class="back-to-top-btn-container"
      >
        <BtnPlain
          class="back-to-top-btn"
          @click="scrollTop"
        >
          <Chevron class="chevron" />
        </BtnPlain>
      </div>
    </transition>
  </div>
</template>

<script lang="ts">
import {
  onBeforeUnmount,
  onMounted,
  defineComponent,
  ref,
} from 'vue';
import BtnPlain from './buttons/BtnPlain.vue';
import Chevron from '../../icons/chevron.svg?vue-component';

export default defineComponent({
  components: {
    BtnPlain,
    Chevron,
  },
  props: {
    sticky: Boolean,
  },
  setup() {
    const el = ref<HTMLElement>();
    const isVisible = ref(false);

    function handleVisibility() {
      if (!el.value?.parentNode) return;
      isVisible.value = (el.value?.parentNode as HTMLElement)?.scrollTop > 800;
    }

    function scrollTop() {
      (el.value?.parentNode as HTMLElement)?.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    }

    onMounted(() => {
      el.value?.parentNode?.addEventListener('scroll', handleVisibility);
    });

    onBeforeUnmount(() => {
      el.value?.parentNode?.removeEventListener('scroll', handleVisibility);
    });

    return {
      el,
      isVisible,
      scrollTop,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;
@use '@/styles/mixins';

.back-to-top {
  width: 100%;
  height: 0;
  z-index: $z-index-back-to-top;

  &.visible {
    height: 40px;
  }

  &-btn-container {
    @include mixins.flex(flex-end, center);

    pointer-events: none;
    position: fixed;
    bottom: 0;
    left: 0;
    width: 100%;
    padding: 12px 4px 4px 0;
    /* stylelint-disable-next-line declaration-block-no-duplicate-properties */
    background: $color-bg-4;
    background:
      linear-gradient(
        180deg,
        rgba($color-bg-4, 0) 5%,
        rgba($color-bg-4, 0.8) 60%,
        rgba($color-bg-4, 0.9) 100%
      );
  }

  &-btn {
    @include mixins.flex(center, center);

    pointer-events: all;
    height: 40px;
    width: 41px;
    border-radius: 10px;
    background-color: $color-dialog;
    transition: opacity 0.2s ease-in-out;

    &:hover {
      background: rgba(#272727, 0.8);
    }

    &:active {
      background: rgba(#222, 0.8);
    }

    .chevron {
      width: 22px;
      height: 22px;
      transform: rotate(-90deg);
    }
  }

  &.sticky {
    position: sticky;
    bottom: 0;

    .back-to-top-btn-container {
      position: absolute;
    }
  }
}
</style>
