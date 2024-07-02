<template>
  <div
    class="dialog"
    :class="[position, { dense }]"
  >
    <slot />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export const DIALOG_BOX_POSITIONS = [
  'left',
  'bottom',
] as const;
export type DialogBoxPosition = typeof DIALOG_BOX_POSITIONS[number];

export default defineComponent({
  name: 'DialogBox',
  props: {
    dense: Boolean,
    position: {
      type: String,
      validator: (value: DialogBoxPosition) => DIALOG_BOX_POSITIONS.includes(value),
      default: DIALOG_BOX_POSITIONS[0],
    },
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;
@use '@/styles/typography';

.dialog {
  @extend %face-sans-12-regular;

  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
  padding: 10px 8px;
  border-radius: 8px;
  color: rgba($color-white, 0.5);
  background-color: $color-dialog;

  &::after {
    content: '';
    position: absolute;
    z-index: -1;
    width: 8px;
    height: 8px;
    top: 50%;
    left: -4px;
    transform: translateY(-50%) rotate(45deg);
    background-color: $color-dialog;
  }

  &.dense {
    padding: 2px 4px;
    border-radius: 4px;
    letter-spacing: 0;

    &::after {
      left: -3px;
    }
  }

  &.bottom {
    &::after {
      top: auto;
      left: 50%;
      bottom: -8px;
    }

    &.dense::after {
      left: 40%;
    }
  }
}
</style>
