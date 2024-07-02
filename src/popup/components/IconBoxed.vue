<template>
  <div
    class="icon-boxed"
    :class="[
      `variant-${variant}`,
      { 'icon-smaller': iconSmaller },
    ]"
  >
    <slot>
      <Component
        :is="icon"
        class="icon"
      />
    </slot>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

export const ICON_BOXED_VARIANT = [
  'muted',
  'danger',
  'success',
] as const;

export type IconBoxedVariant = typeof ICON_BOXED_VARIANT[number];

export default defineComponent({
  props: {
    icon: { type: Object, default: null },
    iconSmaller: Boolean,
    variant: {
      type: String as PropType<IconBoxedVariant>,
      validator: (value: IconBoxedVariant) => ICON_BOXED_VARIANT.includes(value),
      default: ICON_BOXED_VARIANT[0],
    },
  },
});
</script>

<style lang="scss">
@use '@/styles/variables' as *;

.icon-boxed {
  --icon-size: 48px;

  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  border: 4px solid rgba($color-white, 0.05);
  border-radius: 50%;
  background-color: $color-bg-1;
  background-clip: content-box;

  .icon {
    width: var(--icon-size);
    height: var(--icon-size);
  }

  &.icon-smaller {
    --icon-size: 38px;
  }

  &.variant {
    &-muted {
      border-color: rgba($color-white, 0.05);
      background-color: $color-bg-1;
    }

    &-danger {
      color: $color-danger;
      border-color: rgba($color-danger, 0.1);
      background-color: rgba($color-danger, 0.2);
    }

    &-success {
      color: $color-success-dark;
      border-color: rgba($color-success-dark, 0.1);
      background-color: rgba($color-success-dark, 0.2);
    }
  }
}
</style>
