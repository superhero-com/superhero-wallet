<template>
  <div class="input-field">
    <label
      v-if="label"
      class="label"
    >
      {{ label }}
    </label>
    <div
      :class="[{ error }, { plain }, { readonly }]"
      class="wrapper"
      data-cy="input-wrapper"
    >
      <slot
        v-if="!error"
        name="left"
      />
      <Error v-else />
      <input
        v-bind="$attrs"
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
    value: { type: [String, Number], default: null },
    error: Boolean,
    errorMessage: { type: String, default: '' },
    placeholder: { type: String, default: '' },
    type: { type: String, default: 'text' },
    label: { type: String, default: '' },
    readonly: Boolean,
    plain: Boolean,
  },
};
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';
@use '../../../styles/typography';

.input-field {
  .label {
    margin: 8px 0;
    display: block;

    @extend %face-sans-15-medium;

    color: variables.$color-dark-grey;
    text-align: left;
  }

  .wrapper {
    display: flex;
    align-items: center;
    padding: 8px 16px;
    height: 40px;
    background-color: variables.$color-bg-2;
    border: 1px solid transparent;
    border-left: 0;
    border-right: 0;
    border-radius: 6px;

    &:focus-within {
      border-color: variables.$color-blue;
      background-color: variables.$color-black;
    }

    &.error,
    &.error.plain {
      border-color: variables.$color-error;
    }

    &.plain {
      height: 24px;
      background: transparent;
      border-top: none;
      padding: 0;
      border-radius: unset;
      border-color: variables.$color-blue;

      &.readonly {
        border-color: transparent;

        input:not(:only-child) {
          opacity: 0.5;
        }
      }

      input:not(:only-child) {
        padding: 0;
        color: variables.$color-white;
        font-weight: 500;
      }
    }

    ::v-deep svg {
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

      color: variables.$color-light-grey;

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
    color: variables.$color-error;
  }
}
</style>
