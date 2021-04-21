<template>
  <div class="input-field">
    <label
      v-if="label"
      class="label"
    >
      {{ label }}
    </label>
    <div
      :class="{ error }"
      class="wrapper"
      data-cy="input-wrapper"
    >
      <slot
        v-if="!error"
        name="left"
      />
      <Error v-else />
      <input
        :type="type"
        class="input"
        :placeholder="placeholder"
        :value="value"
        :data-cy="type ? `input-${type}` : 'input'"
        :disabled="readonly"
        step="any"
        @input="$emit('input', $event.target.value)"
      >
      <slot name="right" />
    </div>
    <div
      v-if="error && errorMessage"
      class="error-message"
    >
      {{ errorMessage }}
    </div>
  </div>
</template>

<script>
import Error from '../../../icons/error.svg?vue-component';

export default {
  components: { Error },
  props: {
    value: [String, Number],
    error: Boolean,
    errorMessage: String,
    placeholder: String,
    type: {
      type: String,
      default: 'text',
    },
    label: String,
    readonly: Boolean,
  },
};
</script>

<style lang="scss" scoped>
@import '../../../styles/typography';

.input-field {
  .label {
    margin: 8px 0;
    display: block;

    @extend %face-sans-15-medium;

    color: $color-dark-grey;
    text-align: left;
  }

  .wrapper {
    display: flex;
    align-items: center;
    padding: 8px 16px;
    height: 40px;
    background-color: $color-bg-2;
    border: 1px solid transparent;
    border-left: 0;
    border-right: 0;
    border-radius: 6px;

    &:focus-within {
      border-color: $color-blue;
      background-color: $color-black;
    }

    &.error {
      border-color: $color-error;
    }

    svg {
      width: 24px;
      height: 24px;
      flex-shrink: 0;
    }

    input {
      display: block;
      width: 100%;
      outline: none;
      border: none;
      background: transparent;
      box-shadow: none;

      &:not(:only-child) {
        padding: 0 6px;
      }

      @extend %face-sans-14-regular;

      color: $color-light-grey;

      &[type='number'] {
        -moz-appearance: textfield;
      }

      &[type='number']::-webkit-outer-spin-button,
      &[type='number']::-webkit-inner-spin-button {
        -webkit-appearance: none;
      }
    }
  }

  .error-message {
    margin-top: 9px;

    @extend %face-sans-12-regular;

    text-align: left;
    color: $color-error;
  }
}
</style>
