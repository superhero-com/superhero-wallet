<template>
  <div
    class="icon-wrapper"
    :class="{ 'is-boxed': isBoxed }"
  >
    <Component
      :is="icon"
      class="icon-wrapper-icon"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  props: {
    icon: { type: Object, required: true },
    isBoxed: Boolean,
  },
});
</script>

<style lang="scss" scoped>
@use '../../styles/variables' as *;

.icon-wrapper {
  display: inline-flex;
  transition: $transition-interactive;

  .icon-wrapper-icon {
    width: 24px;
    height: 24px;
    color: inherit;
  }

  &.is-boxed {
    padding: 7px;
    background-color: rgba($color-white, 0.15);
    border-radius: 14px;
  }
}
</style>
