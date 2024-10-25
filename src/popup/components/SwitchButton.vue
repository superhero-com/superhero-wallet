<template>
  <div
    class="switch-button"
    :class="{
      disabled,
      checked: !!modelValue,
    }"
  >
    <div
      class="label"
      v-text="label"
    />
    <label class="switch">
      <input
        :checked="modelValue"
        type="checkbox"
        :disabled="disabled"
        @change="$emit('update:modelValue', !modelValue)"
      >
      <span class="slider round" />
    </label>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  props: {
    modelValue: Boolean,
    label: { type: String, default: '' },
    disabled: Boolean,
  },
  emits: {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    'update:modelValue': (checked: boolean) => true,
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;
@use '@/styles/typography';

.switch-button {
  width: 100%;
  display: inline-flex;
  justify-content: space-between;
  align-items: center;

  &.disabled {
    opacity: 0.75;

    .switch .slider {
      cursor: not-allowed;
    }
  }

  .label {
    @extend %face-sans-15-medium;

    color: rgba($color-white, 0.5);
    transition: color .1s;
  }

  .switch {
    position: relative;
    display: inline-block;
    width: 36px;
    height: 20px;

    input {
      opacity: 0;
      width: 0;
      height: 0;
    }

    .slider {
      position: absolute;
      cursor: pointer;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba($color-white, 0.15);
      transition: 0.4s;

      &::before {
        content: '';
        position: absolute;
        height: 16px;
        width: 16px;
        left: 2px;
        bottom: 2px;
        background-color: rgba($color-white, 0.75);
        transition: 0.4s;
      }

      &.round {
        border-radius: 12px;

        &::before {
          border-radius: 50%;
        }
      }
    }
  }

  &.checked {
    .label {
      color: rgba($color-white, 1);
    }

    .switch {
      .slider {
        background-color: $color-primary;

        &::before {
          background-color: rgba($color-white, 1);
          transform: translateX(16px);
        }
      }
    }
  }
}
</style>
