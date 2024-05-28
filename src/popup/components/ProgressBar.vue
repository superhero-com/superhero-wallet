<template>
  <div class="progress-bar">
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
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.progress-bar {
  height: 12px;
  border-radius: 4px;
  overflow: hidden;
  background-color: rgba($color-white, 0.1);

  .progress {
    height: 100%;
    background-color: $color-success-dark;
    transition: width 100ms;
  }
}
</style>
