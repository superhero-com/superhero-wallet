<template>
  <label
    class="radio-button"
    :class="{ disabled }"
  >
    <span
      class="radio-dot"
      :class="{ checked: value }"
    >
      <input
        class="input"
        :disabled="disabled"
        :value="value"
        :type="type"
        :name="name"
      >
    </span>

    <span
      class="radio-holder"
      :class="{ checked: value }"
    >
      <slot />
    </span>
  </label>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  props: {
    value: { type: [String, Number, Boolean], default: '' },
    type: { type: String, default: 'checkbox' },
    name: { type: String, default: '' },
    disabled: Boolean,
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;
@use '@/styles/mixins';

.radio-button {
  @include mixins.flex(flex-start, center);

  cursor: pointer;
  user-select: none;

  &.disabled {
    opacity: 50%;
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
    border-radius: 50%;
    border: 1px solid rgba($color-white, 0.5);
    width: 20px;
    height: 20px;
    background: var(--screen-bg-color);
    margin-right: 6px;
    opacity: 0.5;
    flex-shrink: 0;

    &::after {
      content: '';
      position: absolute;
      border-radius: 50%;
      width: 0;
      height: 0;
      top: 50%;
      left: 50%;
      background: $color-primary;
      transition: all 0.15s ease-in-out;
      transform: translate(-50%, -50%);
    }

    &.checked {
      opacity: 1;

      &::after {
        width: 14px;
        height: 14px;
        opacity: 1;
      }
    }
  }

  .radio-holder {
    width: 100%;
    opacity: 0.5;

    &.checked {
      opacity: 1;
    }
  }
}
</style>
