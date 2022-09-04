<template>
  <label
    class="radio-container"
    :class="{ disabled }"
  >
    <input
      :disabled="disabled"
      :value="value"
      :type="type"
      :name="name"
      @change="handleChange"
    >
    <span
      class="radio-dot"
      :class="{ checked: value }"
    />
    <slot class="radio-holder" />
  </label>
</template>

<script>
export default {
  props: {
    value: { type: [String, Number, Boolean], default: '' },
    type: { type: String, default: 'checkbox' },
    name: { type: String, default: '' },
    disabled: { type: Boolean },
  },
  methods: {
    handleChange(event) {
      if (this.disabled) return;
      this.$emit('input', event.target.checked);
    },
  },
};
</script>

<style lang="scss" scoped>
@use '../../../styles/variables.scss';
@use '../../../styles/mixins.scss';

.radio-container {
  @include mixins.flex(flex-start, center);

  cursor: pointer;

  input {
    position: absolute;
    opacity: 0;
    height: 0;
    width: 0;
  }

  &.disabled {
    opacity: 50%;
    cursor: not-allowed;
  }

  .radio-dot {
    border-radius: 50%;
    border: 1px solid rgba(255, 255, 255, 0.5);
    width: 20px;
    height: 20px;
    background: variables.$color-bg-3;
    margin-right: 6px;
    position: relative;

    &::after {
      content: '';
      position: absolute;
      border-radius: 50%;
      width: 0;
      height: 0;
      top: 50%;
      left: 50%;
      background: variables.$color-blue;
      transition: all 0.15s ease-in-out;
      transform: translate(-50%, -50%);
    }

    &.checked {
      &::after {
        width: 14px;
        height: 14px;
        opacity: 1;
      }
    }
  }
}
</style>
