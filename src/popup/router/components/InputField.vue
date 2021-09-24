<template>
  <div class="input-field">
    <label class="label">
      {{ label }}
      <slot name="label" />
    </label>
    <div
      :class="{ error, warning, plain, readonly }"
      class="wrapper"
      data-cy="input-wrapper"
    >
      <slot
        v-if="!error && !warning"
        name="left"
      />
      <StatusIcon
        v-else
        :status="error && 'alert' || warning && 'warning'"
      />
      <input
        class="input"
        v-bind="$attrs"
        :value="value"
        :data-cy="$attrs.type ? `input-${$attrs.type}` : 'input'"
        :disabled="readonly"
        step="any"
        @input="$emit('input', $event.target.value)"
      >
      <slot name="right" />
    </div>
    <div
      v-if="error && errorMessage || warning && warningMessage"
      :class="['message', { error, warning }]"
    >
      {{ error ? errorMessage : warningMessage }}
    </div>
  </div>
</template>

<script>
import StatusIcon from './StatusIcon';

export default {
  components: { StatusIcon },
  props: {
    value: { type: [String, Number], default: null },
    error: Boolean,
    errorMessage: { type: String, default: '' },
    warning: Boolean,
    warningMessage: { type: String, default: '' },
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

    &.warning {
      border-color: variables.$color-warning;
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

      &::placeholder {
        @extend %face-sans-14-regular;

        color: variables.$color-dark-grey;
      }

      &[type='number'] {
        -moz-appearance: textfield;
      }

      &[type='number']::-webkit-outer-spin-button,
      &[type='number']::-webkit-inner-spin-button {
        -webkit-appearance: none;
      }
    }
  }

  .message {
    margin-top: 9px;

    @extend %face-sans-12-regular;

    text-align: left;

    &.error {
      color: variables.$color-error;
    }

    &.warning {
      color: variables.$color-warning;
    }
  }
}
</style>
