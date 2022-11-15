<template>
  <div
    class="input-field"
    :class="{
      'error': hasError,
      'warning': hasWarning,
      readonly,
      code,
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
        v-if="$slots['label-after'] || textLimit"
        class="label-after"
      >
        <slot name="label-after">
          {{ availableTextLimit }}
        </slot>
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
        <slot
          :id="_uid"
          :input-id="inputId"
        >
          <input
            :id="inputId"
            v-bind="$attrs"
            :type="type"
            class="input"
            autocomplete="off"
            step="any"
            :value="value"
            :data-cy="$attrs.type ? `input-${$attrs.type}` : 'input'"
            :disabled="readonly"
            :maxlength="textLimit"
            :inputmode="inputMode"
            @input="handleInput"
            @keydown="checkIfNumber"
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
      v-if="showMessage"
      class="message"
      data-cy="input-message"
    >
      <label
        class="message-text"
        :for="inputId"
      >
        {{ typeof message === 'object' ? message && message.text : message }}
      </label>
    </div>
  </div>
</template>

<script>
import QuestionCircleIcon from '../../icons/question-circle-border.svg?vue-component';

export default {
  components: {
    QuestionCircleIcon,
  },
  props: {
    value: { type: [String, Number], default: null },
    label: { type: String, default: '' },
    type: { type: String, default: 'text' },
    message: {
      type: [String, Object],
      validator(value) {
        if (typeof value === 'object' && value.status) {
          return ['success', 'warning', 'error'].includes(value.status);
        }
        return true;
      },
      default: null,
    },
    readonly: Boolean,
    showHelp: Boolean,
    showMessageHelp: Boolean,
    code: Boolean,
    textLimit: {
      type: Number,
      default: null,
    },
  },
  data: () => ({
    focused: false,
  }),
  computed: {
    inputId() {
      return `input-${this._uid}`;
    },
    inputMode() {
      return this.type === 'number' ? 'decimal' : 'text';
    },
    hasError() {
      if (typeof this.message === 'object') {
        return this.message?.status === 'error';
      }
      return !!this.message;
    },
    hasWarning() {
      if (typeof this.message === 'object') {
        return this.message?.status === 'warning';
      }
      return false;
    },
    showMessage() {
      if (typeof this.message === 'object') {
        return !this.message?.hideMessage;
      }
      return !!this.message;
    },
    availableTextLimit() {
      return (this.textLimit && this.value?.length)
        ? this.textLimit - this.value.length
        : this.textLimit;
    },
  },
  methods: {
    checkIfNumber(event) {
      const isSingleChar = event.key.length === 1 && !event.ctrlKey && !event.metaKey;
      const alreadyHasDot = (typeof this.value === 'string' && this.value?.includes('.')) && [',', '.'].includes(event.key);
      if (
        this.type === 'number'
        && isSingleChar
        && (alreadyHasDot || !/^([0-9]+|,|\.)$/.test(event.key)) // Non numerical
      ) {
        event.preventDefault();
      }
    },
    handleInput(event) {
      const { value } = event.target;
      this.$emit('input', this.type === 'number' ? value?.replace(',', '.') : value);
    },

  },
};
</script>

<style lang="scss" scoped>
@use '../../styles/variables';
@use '../../styles/typography';

.input-field {
  --color-border: transparent;
  --color-bg: #{rgba(variables.$color-white, 0.08)};
  --color-input-text: #{variables.$color-grey-light};
  --color-placeholder: #{rgba(variables.$color-white, 0.75)};
  --color-message: #{rgba(variables.$color-white, 0.75)};

  text-align: left;

  &:focus-within,
  &:hover {
    --color-input-text: #{variables.$color-white};
  }

  &:hover {
    --color-border: #{rgba(variables.$color-white, 0.15)};
    --color-bg: #{rgba(variables.$color-white, 0.05)};
  }

  &:focus-within {
    --color-border: #{variables.$color-primary};
    --color-bg: #{rgba(variables.$color-black, 0.44)};
    --color-placeholder: #{variables.$color-white};
  }

  .label {
    display: flex;
    align-items: center;
    margin-top: 16px;

    &-text {
      margin: 5px 0;
      display: inline-block;
    }

    &-help {
      display: block;
      width: 25px;
      height: 20px;
      padding-left: 5px;
      color: inherit;
    }

    &-after {
      @extend %face-sans-15-regular;

      margin-left: auto;
      color: variables.$color-grey-dark;
    }
  }

  .input-wrapper {
    display: block;
    padding: 8px 12px;
    background-color: var(--color-bg);
    border: none;
    border-radius: variables.$border-radius-interactive;
    box-shadow: inset 0 0 0 2px var(--color-border);
    transition: 100ms ease-in-out;
    cursor: text;

    .main-inner {
      display: flex;
      align-items: center;
      width: 100%;
      overflow: hidden;

      .icon {
        width: 24px;
        height: 24px;
        flex-shrink: 0;
      }
    }

    .input {
      @extend %face-sans-15-regular;

      display: block;
      width: 100%;
      padding: 0;
      outline: none;
      border: none;
      background: transparent;
      box-shadow: none;
      color: var(--color-input-text);
      transition: 100ms ease-in-out;

      &::placeholder {
        @extend %face-sans-15-regular;

        color: var(--color-placeholder);
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
    color: var(--color-message);

    &-help {
      display: block;
      width: 25px;
      height: 20px;
      padding-left: 5px;
      color: inherit;
    }
  }

  &.error {
    --color-border: #{variables.$color-danger};
    --color-message: #{variables.$color-danger};
  }

  &.warning {
    --color-border: #{variables.$color-warning};
    --color-message: #{variables.$color-warning};
  }

  &.readonly {
    --color-border: transparent;

    .input-wrapper {
      .input {
        opacity: 0.5;
      }
    }
  }

  &.code {
    .input {
      @extend %face-mono-10-medium;
    }
  }
}
</style>
