<template>
  <div
    class="input-field"
    :class="{
      'new-ui': newUi,
      'error': hasError,
      'warning': !hasError && hasWarning,
      plain,
      readonly
    }"
  >
    <div
      v-if="label || $slots.label || $slots['label-after']"
      class="label"
    >
      <label
        :for="inputId"
        class="label-text"
      >
        <slot name="label">{{ label }}</slot>
      </label>

      <a
        v-if="showHelp"
        class="label-help"
        @click.prevent="$emit('help')"
      >
        <QuestionCircleIcon />
      </a>

      <div
        v-if="$slots['label-after']"
        class="label-after"
      >
        <slot name="label-after" />
      </div>
    </div>

    <label
      data-cy="input-wrapper"
      class="input-wrapper"
    >
      <div class="main-inner">
        <slot
          v-if="!hasError && !hasWarning"
          name="before"
        />
        <StatusIcon
          v-else-if="!newUi"
          :status="hasError && 'alert' || hasWarning && 'warning'"
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
        <slot
          name="after"
          :focused="focused"
        />
      </div>

      <div class="under">
        <slot
          name="under"
          :focused="focused"
        />
      </div>
    </label>

    <div
      v-if="hasError || hasWarning"
      class="message"
    >
      <label
        class="message-text"
        :for="inputId"
      >
        {{ hasError ? errorMessage : warningMessage }}
      </label>

      <a
        v-if="showMessageHelp"
        class="message-help"
        @click.prevent="$emit('help-message')"
      >
        <QuestionCircleIcon />
      </a>
    </div>
  </div>
</template>

<script>
import StatusIcon from './StatusIcon.vue';
import QuestionCircleIcon from '../../../icons/question-circle-border.svg?vue-component';

export default {
  components: {
    StatusIcon,
    QuestionCircleIcon,
  },
  props: {
    value: { type: [String, Number], default: null },
    label: { type: String, default: '' },
    errorMessage: { type: String, default: '' },
    warningMessage: { type: String, default: '' },
    readonly: Boolean,
    plain: Boolean,
    showHelp: Boolean,
    showMessageHelp: Boolean,
    newUi: Boolean,
  },
  data: () => ({
    focused: false,
  }),
  computed: {
    inputId() {
      // eslint-disable-next-line no-underscore-dangle
      return `input-${this._uid}`;
    },
    hasError() {
      return !!this.errorMessage;
    },
    hasWarning() {
      return !!this.warningMessage;
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
    display: flex;
    align-items: center;

    &-text {
      @extend %face-sans-15-medium;

      margin-bottom: 8px 0;
      display: inline-block;
      color: variables.$color-dark-grey;
    }

    &-help {
      display: block;
      width: 25px;
      height: 20px;
      padding-left: 5px;
      color: inherit;
    }

    &-after {
      margin-left: auto;
    }
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

    display: flex;
    align-items: center;
    margin-top: 9px;
    text-align: left;
  }

  &.error,
  &.error.plain {
    .input-wrapper {
      border-color: variables.$color-error;
    }

    &-help {
      display: block;
      width: 25px;
      height: 20px;
      padding-left: 5px;
      color: inherit;
    }
  }

  &.error,
  &.error.plain {
    .input-wrapper {
      border-color: variables.$color-error;
    }

    .message {
      color: variables.$color-error;
    }
  }

  &.warning {
    .input-wrapper {
      border-color: variables.$color-warning;
    }

    .message {
      color: variables.$color-warning;
    }
  }

  &.plain {
    .input-wrapper {
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
  }

  &.readonly {
    .input-wrapper {
      border-color: transparent;

      .input:not(:only-child) {
        opacity: 0.5;
      }
    }
  }

  &.new-ui {
    .label {
      margin-top: 16px;

      &-text {
        margin: 5px 0;
      }
    }

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

    &.error {
      .input-wrapper {
        box-shadow: inset 0 0 0 2px variables.$color-error;
      }
    }

    &.warning {
      .input-wrapper {
        box-shadow: inset 0 0 0 2px variables.$color-warning;
      }
    }
  }
}
</style>
