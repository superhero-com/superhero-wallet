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
    isBig: Boolean,
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;
@use '@/styles/typography';

.progress-bar {
  position: relative;
  overflow: hidden;
  border-radius: 4px;
  height: 12px;
  background-color: rgba($color-white, 0.1);

  &.big {
    height: 24px;
  }

  .text {
    @extend %text-body;
    position: absolute;
    z-index: 1;
    left: 8px;
    line-height: 24px;
    color: $color-white;
  }

  .progress {
    position: absolute;
    transition: width 100ms;
    height: 100%;
    background-color: $color-success-dark;
  }
}
</style>
