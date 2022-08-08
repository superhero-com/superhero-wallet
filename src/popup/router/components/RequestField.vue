<template>
  <div
    class="input-field"
    :class="{ readonly }"
    v-bind="$attrs"
  >
    <div
      class="input-wrapper"
      :style="wrapperCssProps"
    >
      <label
        v-if="label || $slots.label"
        class="label"
      >
        {{ label }}
        <slot name="label" />
      </label>
      <div class="main-wrapper">
        <main
          :class="{ error, warning, plain }"
          data-cy="input-wrapper"
        >
          <slot
            v-if="!error && !warning"
            name="error"
          />
          <StatusIcon
            v-else
            :status="error && 'alert' || warning && 'warning'"
          />
          <div class="amount-fields">
            <input
              class="input"
              v-bind="$attrs"
              autocomplete="off"
              :value="value"
              :data-cy="$attrs.type ? `input-${$attrs.type}` : 'input'"
              :disabled="readonly"
              step="any"
              @input="$emit('input', $event.target.value)"
              @focus="isInputOnFocus = true"
              @blur="isInputOnFocus = false"
            >
            <div>
              <slot
                name="left"
              />
            </div>
          </div>
          <div>
            <slot
              name="right"
            />
          </div>
        </main>
        <slot name="buttons" />
      </div>
      <div
        v-if="error && errorMessage || warning && warningMessage"
        :class="['message', { error, warning }]"
      >
        {{ error ? errorMessage : warningMessage }}
      </div>
    </div>
  </div>
</template>

<script>
import StatusIcon from './StatusIcon.vue';

export default {
  components: { StatusIcon },
  props: {
    value: { type: [String, Number], default: null },
    readonly: Boolean,
    error: Boolean,
    errorMessage: { type: String, default: '' },
    warning: Boolean,
    warningMessage: { type: String, default: '' },
    label: { type: String, default: '' },
    plain: Boolean,
    height: { type: String, default: '40px' },
  },
  methods: {
    wrapperCssProps() {
      return {
        '--height': this.height,
      };
    },
  },
};
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';
@use '../../../styles/typography';

.input-field {
  .input-wrapper {
    .label {
      margin: 8px 0;
      display: block;

      @extend %face-sans-15-medium;

      color: variables.$color-dark-grey;
      text-align: left;
    }

    .main-wrapper {
      display: flex;
      width: 312px;

      main {
        display: flex;
        flex-grow: 1;
        flex-direction: row;
        justify-content: space-between;
        padding: 8px 16px;
        height: var(--height);
        background-color: variables.$color-bg-2;
        border: 1px solid transparent;
        border-radius: 6px;

        .amount-fields {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 4px;

          input {
            display: block;
            width: 100%;
            padding: 0;
            outline: none;
            border: none;
            background: transparent;
            box-shadow: none;

            &:not(:first-child) {
              padding-left: 6px;
            }

            @extend %face-sans-14-regular;

            color: variables.$color-white;

            &::placeholder {
              @extend %face-sans-15-regular;

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

        &:not(:only-child) {
          border-radius: 6px 2px 2px 6px;
        }

        &:focus-within {
          border-color: variables.$color-blue;
          background-color: variables.$color-black;
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

  &.readonly ::v-deep main.plain {
    border-color: transparent;

    input:not(:only-child) {
      opacity: 0.5;
    }
  }

  .plain input:not(:only-child) {
    padding: 0;
    color: variables.$color-white;
    font-weight: 500;
  }
}
</style>
