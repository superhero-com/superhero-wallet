<template>
  <label class="checkbox-container">
    <input
      :disabled="disabled"
      :checked="!!modelValue"
      :type="type"
      :name="name"
      @change="$emit('update:modelValue', ($event.target as HTMLInputElement).checked)"
    >

    <span
      class="checkmark"
      :class="{ checked: modelValue, disabled }"
    />

    <div
      v-if="$slots.default"
      class="label-text"
      :class="{ checked: modelValue }"
    >
      <slot />
    </div>
  </label>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'CheckBox',
  props: {
    modelValue: { type: [String, Number, Boolean], default: '' },
    type: { type: String, default: 'checkbox' },
    name: { type: String, default: '' },
    disabled: Boolean,
  },
  emits: ['update:modelValue'],
});
</script>

<style lang="scss" scoped>
@use '../../styles/variables';

.checkbox-container {
  display: flex;
  position: relative;
  align-items: center;
  cursor: pointer;
  justify-content: flex-start;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;

  & > * {
    transition: all 0.15s ease-in-out;
  }

  &:hover {
    .checkmark {
      border-color: rgba(variables.$color-white, 0.5);
      background-color: variables.$color-bg-1-hover;
    }

    .label-text {
      color: rgba(variables.$color-white, 0.75);
    }
  }

  input {
    position: absolute;
    opacity: 0;
    cursor: pointer;
    height: 0;
    width: 0;
  }

  .checkmark {
    background-color: variables.$color-bg-1;
    border: 1px solid rgba(variables.$color-white, 0.3);
    box-shadow: inset 1 1 4px rgba(variables.$color-black, 0.25);
    border-radius: 4px;
    height: 20px;
    width: 20px;
    margin-right: 10px;
    flex-shrink: 0;

    &.checked {
      border: none;
      box-shadow: none;
      background-color: variables.$color-primary;
      background-image: url('../../icons/checkbox-checked.svg');

      &.disabled {
        filter: brightness(0.8);
      }
    }
  }

  .label-text {
    color: rgba(variables.$color-white, 0.5);

    &.checked {
      color: variables.$color-white;
    }
  }
}
</style>
