<template>
  <div
    class="progress-bar"
    :class="{ big: isBig }"
  >
    <div
      v-if="showText"
      class="text"
    >
      <strong>{{ progress }}%</strong> {{ text }}
    </div>
    <div
      class="progress"
      :style="{ width: `${progress}%` }"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  props: {
    progress: { type: Number, default: 0 },
    showText: { type: Boolean, default: false },
    text: { type: String, default: '' },
    isBig: { type: Boolean, default: false },
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;
@use '@/styles/typography';

.progress-bar {
  height: 12px;
  border-radius: 4px;
  overflow: hidden;
  background-color: rgba($color-white, 0.1);
  position: relative;

  &.big {
    height: 24px;
  }

  .text {
    @extend %face-sans-16-regular;
    line-height: 24px;
    color: $color-white;
    position: absolute;
    left: 8px;
    z-index: 1;
  }

  .progress {
    height: 100%;
    background-color: $color-success-dark;
    transition: width 100ms;
    position: absolute;
  }
}
</style>
