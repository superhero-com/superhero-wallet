<template>
  <div
    class="input-field"
    :class="{ 'new-ui': newUi }"
  >
    <label
      v-if="label || $slots.label"
      :for="inputId"
      class="label"
    >
      <slot name="label">{{ label }}</slot>
    </label>

    <label
      data-cy="input-wrapper"
      class="input-wrapper"
      :class="{ error, warning, plain, readonly }"
    >
      <div class="main-inner">
        <slot
          v-if="!error && !warning"
          name="left"
        />
        <StatusIcon
          v-else
          :status="error && 'alert' || warning && 'warning'"
        />
        <slot
          :id="_uid"
          :input-id="inputId"
        >
          <input
            :id="inputId"
            v-bind="$attrs"
            class="input"
            autocomplete="off"
            step="any"
            :value="value"
            :class="{ 'new-ui': newUi }"
            :data-cy="$attrs.type ? `input-${$attrs.type}` : 'input'"
            :disabled="readonly"
            @input="$emit('input', $event.target.value)"
            @focusin="focused = true"
            @focusout="focused = false"
          >
        </slot>
        <slot name="right" />
      </div>

      <div class="under">
        <slot
          name="under"
          :focused="focused"
        />
      </div>
    </label>

    <label
      v-if="error && errorMessage || warning && warningMessage"
      class="message"
      :class="{ error, warning }"
      :for="inputId"
    >
      {{ error ? errorMessage : warningMessage }}
    </label>
  </div>
</template>

<script>
import StatusIcon from './StatusIcon.vue';

export default {
  components: {
    StatusIcon,
  },
  props: {
    value: { type: [String, Number], default: null },
    label: { type: String, default: '' },
    error: Boolean,
    errorMessage: { type: String, default: '' },
    warning: Boolean,
    warningMessage: { type: String, default: '' },
    readonly: Boolean,
    plain: Boolean,
    newUi: Boolean,
  },
  data: () => ({
    focused: false,
  }),
  computed: {
    inputId() {
      return `input-${this._uid}`;
    },
  },
};
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';
@use '../../../styles/typography';

.input-field {
  text-align: left;

  .label {
    @extend %face-sans-15-medium;

    margin: 8px 0;
    display: inline-block;
    color: variables.$color-dark-grey;
  }

  .input-wrapper {
    display: block;
    padding: 8px 16px;
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
      background: transparent;
      border-top: none;
      padding: 0;
      border-radius: unset;
      border-color: variables.$color-blue;

      .input:not(:only-child) {
        padding: 0;
        color: variables.$color-white;
        font-weight: 500;
      }
    }

    &.readonly {
      border-color: transparent;

      .input:not(:only-child) {
        opacity: 0.5;
      }
    }

    .main-inner {
      display: flex;
      align-items: center;
      width: 100%;

      ::v-deep svg {
        width: 24px;
        height: 24px;
        flex-shrink: 0;
      }
    }

    .input {
      @extend %face-sans-14-regular;

      display: block;
      width: 100%;
      padding: 0;
      outline: none;
      border: none;
      background: transparent;
      box-shadow: none;
      color: variables.$color-light-grey;

      &:not(:first-child) {
        padding-left: 6px;
      }

      &::placeholder {
        @extend %face-sans-14-regular;

        color: rgba(variables.$color-white, 0.75);
      }

      &[type='number'] {
        -moz-appearance: textfield;

        &::-webkit-outer-spin-button,
        &::-webkit-inner-spin-button {
          -webkit-appearance: none;
        }
      }
    }

    .under {
      @extend %face-sans-14-regular;

      color: rgba(variables.$color-white, 0.5);
    }
  }

  .message {
    @extend %face-sans-12-regular;

    display: block;
    margin-top: 9px;
    text-align: left;

    &.error {
      color: variables.$color-error;
    }

    &.warning {
      color: variables.$color-warning;
    }
  }

  &.new-ui {
    .input-wrapper {
      border: none;
      background: rgba(variables.$color-white, 0.08);
      border-radius: variables.$border-radius-interactive;
      padding: 8px 12px;
      transition: 0.1s ease-in-out;

      &:hover,
      &:focus-within {
        .input {
          color: variables.$color-white;
        }
      }

      &:hover {
        box-shadow: inset 0 0 0 2px rgba(variables.$color-white, 0.15);
        background-color: rgba(variables.$color-white, 0.05);
      }

      &:focus-within {
        box-shadow: inset 0 0 0 2px variables.$color-primary;
        background-color: rgba(variables.$color-black, 0.44);

        .input {
          &::placeholder {
            color: variables.$color-white;
          }
        }
      }

      &.error {
        box-shadow: inset 0 0 0 2px variables.$color-error;
      }

      &.warning {
        box-shadow: inset 0 0 0 2px variables.$color-warning;
      }

      &.plain {
        padding-left: 0;
        padding-right: 0;
        border-radius: unset;
        border-bottom: 2px solid variables.$color-blue;
        background: transparent;
      }

      .input {
        @extend %face-sans-15-regular;

        transition: 0.1s ease-in-out;

        &::placeholder {
          @extend %face-sans-15-regular;
        }
      }
    }
  }
}
</style>
