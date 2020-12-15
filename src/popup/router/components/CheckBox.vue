<template>
  <label class="checkbox-container">
    <input
      :disabled="disabled"
      :value="value"
      :type="type"
      :name="name"
      @change="$emit('input', $event.target.checked)"
    />
    <span class="checkmark" :class="{ checked: value, disabled }" />
    <slot class="checkbox-holder" />
  </label>
</template>

<script>
export default {
  props: {
    value: { type: [String, Number, Boolean], default: '' },
    type: { type: String, default: 'checkbox' },
    name: { type: String },
    disabled: { type: Boolean },
  },
};
</script>

<style lang="scss" scoped>
@import '../../../styles/variables';

.checkbox-container {
  display: flex;
  position: relative;
  height: 20px;
  cursor: pointer;
  justify-content: start;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;

  input {
    position: absolute;
    opacity: 0;
    cursor: pointer;
    height: 0;
    width: 0;
  }

  .checkmark {
    background-color: #272831;
    border: 1.3px solid $border-track-color;
    border-radius: 2px;
    height: 20px;
    width: 20px;
    margin-right: 15px;

    &.checked {
      background-image: url('../../../icons/checkbox-checked.svg');

      &.disabled {
        filter: brightness(0.8);
      }
    }
  }

  .checkbox-holder {
    position: relative;
    margin: 0 10px;
  }
}
</style>
