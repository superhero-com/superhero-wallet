<template>
  <span class="badge">
    <slot />
    <span
      v-if="text !== null"
      class="badge-inner"
      data-cy="badge-text"
      v-text="text"
    />
  </span>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  props: {
    text: { type: [Number, String], default: null },
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.badge {
  position: relative;
  display: inline-block;

  &-inner {
    position: absolute;
    z-index: 1;
    right: -2px;
    top: 0;
    min-width: 14px;
    height: 14px;
    padding: 0 3px;
    font-size: 11px;
    font-weight: normal;
    line-height: 14px;
    color: $color-white;
    background: $color-secondary;
    border-radius: 7px;
    text-align: center;
  }
}
</style>
