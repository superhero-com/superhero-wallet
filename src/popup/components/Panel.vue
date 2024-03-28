<template>
  <div class="panel">
    <div
      v-if="header"
      class="panel-header"
      v-text="header"
    />

    <div class="panel-body">
      <slot />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  props: {
    header: { type: String, default: null },
  },
});
</script>

<style lang="scss" scoped>
@use '../../styles/variables' as *;
@use '../../styles/typography';

.panel {
  --card-padding: 12px;

  background: rgba($color-white, 0.08);
  border-radius: $border-radius-interactive;
  overflow: hidden;

  &-header {
    @extend %face-sans-16-semi-bold;

    color: $color-white;
    line-height: 24px;
    padding: 8px var(--card-padding);
  }
}
</style>
