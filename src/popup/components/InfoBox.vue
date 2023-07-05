<template>
  <div
    class="info-box"
    :class="[type]"
  >
    <slot>{{ text }}</slot>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export const INFO_BOX_TYPES = {
  default: 'default',
  success: 'success',
  danger: 'danger',
  warning: 'warning',
} as const;
export type InfoBoxType = keyof typeof INFO_BOX_TYPES;

export default defineComponent({
  props: {
    type: {
      type: String,
      validator: (value: InfoBoxType) => Object.keys(INFO_BOX_TYPES).includes(value),
      default: INFO_BOX_TYPES.default,
    },
    text: {
      type: String,
      default: null,
    },
  },
});
</script>

<style lang="scss" scoped>
@use '../../styles/variables';
@use '../../styles/typography';

.info-box {
  @extend %face-sans-15-regular;

  align-items: center;
  margin-top: 10px;
  padding: 8px 12px;
  border-radius: 4px;
  line-height: 19px;

  &.default {
    background-color: rgba(variables.$color-white, 0.08);
    color: rgba(variables.$color-white, 0.75);
  }

  &.success {
    background-color: rgba(variables.$color-success-dark, 0.15);
    color: variables.$color-success-dark;
  }

  &.danger {
    background-color: rgba(variables.$color-danger, 0.15);
    color: variables.$color-danger;
  }

  &.warning {
    background-color: rgba(variables.$color-warning, 0.15);
    color: variables.$color-warning;
  }
}
</style>
