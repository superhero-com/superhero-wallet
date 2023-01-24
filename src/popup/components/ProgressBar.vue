<template>
  <div class="progress-bar">
    <div
      class="progress"
      :style="{ width: `${progress}%` }"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';

export default defineComponent({
  props: {
    progress: { type: Number, required: true },
  },
});
</script>

<style lang="scss" scoped>
@use '../../styles/variables' as *;

.progress-bar {
  height: 12px;
  border-radius: 4px;
  overflow: hidden;
  background-color: rgba($color-white, 0.1);

  .progress {
    height: 12px;
    background-color: $color-success-dark;
  }
}
</style>
