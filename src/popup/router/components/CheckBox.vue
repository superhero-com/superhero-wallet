<template>
  <label class="checkbox-container">
    <input
      :disabled="disabled"
      :value="value"
      :type="type"
      :name="name"
      @change="$emit('input', $event.target.checked)"
    >

    <span
      class="checkmark"
      :class="{ checked: value, disabled }"
    />

    <div
      v-if="$slots.default"
      class="label-text"
    >
      <slot />
    </div>
  </label>
</template>

<script>
export default {
  props: {
    value: { type: [String, Number, Boolean], default: '' },
    type: { type: String, default: 'checkbox' },
    name: { type: String, default: '' },
    disabled: Boolean,
  },
};
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';

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

  &:hover,
  &:active {
    .checkmark {
      border-color: rgba(variables.$color-white, 0.5);
      background-color: variables.$color-bg-2;
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
    border-radius: 2px;
    height: 20px;
    width: 20px;
    margin-right: 15px;
    flex-shrink: 0;

    &.checked {
      border: none;
      box-shadow: none;
      background-color: variables.$color-primary;
      background-image: url('../../../icons/checkbox-checked.svg');

      &.disabled {
        filter: brightness(0.8);
      }
    }
  }
}
</style>
