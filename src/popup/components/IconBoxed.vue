<template>
  <div
    class="icon-boxed"
    :class="{ [variant]: variant }"
  >
    <slot>
      <Component
        :is="icon"
        class="icon"
        :class="{ small: smallIcon }"
      />
    </slot>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export const ICON_BOXED_VARIANT = [
  'muted',
  'danger',
  'success',
] as const;

export type IconBoxedVariant = typeof ICON_BOXED_VARIANT[number];

export default defineComponent({
  props: {
    icon: { type: Object, default: null },
    smallIcon: Boolean,
    variant: {
      type: String,
      validator: (value: IconBoxedVariant) => ICON_BOXED_VARIANT.includes(value),
      default: ICON_BOXED_VARIANT[0],
    },
  },
});
</script>

<style lang="scss">
@use '../../styles/variables' as *;

.icon-boxed {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  border: 4px solid rgba($color-white, 0.05);
  border-radius: 50%;
  background-color: $color-bg-1;
  background-clip: content-box;

  &.muted {
    border-color: rgba($color-white, 0.05);
    background-color: $color-bg-1;
  }

  &.danger {
    color: $color-danger;
    border-color:  rgba($color-danger, 0.1);
    background-color: rgba($color-danger, 0.2);
  }

  &.success {
    color: $color-success;
    border-color:  rgba($color-success-dark, 0.1);
    background-color: rgba($color-success-dark, 0.2);
  }

  .icon {
    width: 48px;
    height: 48px;

    &.small {
      width: 40px;
      height: 40px;
    }
  }
}
</style>
