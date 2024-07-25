<template>
  <label
    class="radio-button"
    :class="{
      disabled,
      checked: value,
      'has-label-effect': hasLabelEffect,
    }"
  >
    <span class="radio-dot">
      <input
        class="input"
        :disabled="disabled"
        :value="value"
        :type="type"
        :name="name"
      >
    </span>

    <span class="radio-holder">
      <slot :checked="value">{{ label }}</slot>
    </span>
  </label>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

export default defineComponent({
  props: {
    value: { type: [String, Number, Boolean], default: '' },
    type: { type: String as PropType<'checkbox' | 'radio'>, default: 'checkbox' },
    name: { type: String, default: '' },
    label: { type: String, default: '' },
    /** Makes the unchecked input's label semi transparent */
    hasLabelEffect: Boolean,
    disabled: Boolean,
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;
@use '@/styles/mixins';
@use '@/styles/typography';

.radio-button {
  --radio-dot-scale: 0;

  @extend %face-sans-15-medium;

  display: flex;
  cursor: pointer;
  user-select: none;
  transition: opacity 0.15s;

  &.has-label-effect {
    opacity: 0.5;
  }

  &.checked {
    --radio-dot-scale: 1;

    opacity: 1;
  }

  &.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .input {
    position: absolute;
    top: 0;
    left: 0;
    visibility: hidden;
  }

  .radio-dot {
    position: relative;
    width: 20px;
    height: 20px;
    margin-top: 2px;
    margin-right: 6px;
    border-radius: 50%;
    background: var(--screen-bg-color);
    box-shadow: inset 0 0 0 1px rgba($color-white, 0.5);
    flex-shrink: 0;

    &::after {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      width: 70%;
      height: 70%;
      border-radius: inherit;
      background: $color-primary;
      transform: translate(-50%, -50%) scale(var(--radio-dot-scale));
      transition: all 0.15s ease-in-out;
    }
  }

  .radio-holder {
    width: 100%;
  }
}
</style>
