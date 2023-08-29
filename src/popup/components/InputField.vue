<template>
  <div
    class="input-field"
    :class="{
      'error': hasError,
      'warning': hasWarning,
      readonly,
      code,
      thin,
    }"
  >
    <div
      v-if="label || $slots.label || $slots['label-after']"
      class="label"
    >
      <label
        :for="inputId"
        class="label-text"
        @click="$emit('click', $event)"
      >
        <slot name="label">{{ label }}</slot>
      </label>

      <BtnHelp
        v-if="showHelp"
        class="btn-help"
        @help="$emit('help')"
      />
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
      @click="$emit('click', $event)"
    >
      <div class="main-inner">
        <slot
          v-if="!hasError && !hasWarning"
          name="before"
        />
        <slot
          :id="uid"
          :input-id="inputId"
        >
          <input
            v-bind="$attrs"
            :id="inputId"
            class="input"
            autocomplete="off"
            step="any"
            data-cy="input"
            :value="modelValue"
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
        data-cy="input-field-message"
        :for="inputId"
      >
        {{ messageAsObject ? messageAsObject.text : null }}
      </label>
    </div>
  </div>
</template>

<script lang="ts">
import {
  computed,
  watch,
  defineComponent,
  getCurrentInstance,
  PropType,
  ref,
} from 'vue';
import type { IInputMessage, IInputMessageRaw } from '@/types';
import { INPUT_MESSAGE_STATUSES } from '@/constants';
import BtnHelp from './buttons/BtnHelp.vue';

type InputFieldType = 'text' | 'number' | 'url';

export default defineComponent({
  name: 'InputField',
  components: {
    BtnHelp,
  },
  props: {
    modelValue: { type: [String, Number], default: null },
    label: { type: String, default: '' },
    type: {
      type: String as PropType<InputFieldType>,
      default: 'text',
      validator: (value: string) => [
        'text',
        'number',
        'url',
      ].includes(value),
    },
    message: {
      type: [String, Object] as PropType<IInputMessageRaw>,
      validator: (value: IInputMessageRaw) => {
        if (typeof value === 'object' && value.status) {
          return !!INPUT_MESSAGE_STATUSES[value.status];
        }
        return true;
      },
      default: null,
    },
    readonly: Boolean,
    showHelp: Boolean,
    showMessageHelp: Boolean,
    code: Boolean,
    thin: Boolean,
    textLimit: {
      type: Number,
      default: null,
    },
  },
  emits: [
    'update:modelValue',
    'focus-change',
    'click',
    'help',
  ],
  setup(props, { emit }) {
    const uid = getCurrentInstance()?.uid;
    const inputId = `input-${uid}`;

    const focused = ref(false);

    const inputMode = computed(() => props.type === 'number' ? 'decimal' : 'text');
    const messageAsObject = computed(
      (): IInputMessage | null => (typeof props.message === 'object') ? props.message : { text: props.message },
    );
    const hasError = computed(
      () => (
        messageAsObject.value?.status === INPUT_MESSAGE_STATUSES.error
        || !!messageAsObject.value?.text
      ),
    );
    const hasWarning = computed(
      () => (messageAsObject.value?.status === INPUT_MESSAGE_STATUSES.warning),
    );
    const showMessage = computed(
      () => !messageAsObject.value?.hideMessage && !!messageAsObject.value?.text,
    );
    const availableTextLimit = computed(
      () => (props.textLimit && props.modelValue)
        ? props.textLimit - String(props.modelValue).length
        : props.textLimit,
    );

    function checkIfNumber(event: KeyboardEvent) {
      const isSingleChar = event.key.length === 1 && !event.ctrlKey && !event.metaKey;
      const alreadyHasDot = (typeof props.modelValue === 'string' && props.modelValue?.includes('.')) && [',', '.'].includes(event.key);
      if (
        props.type === 'number'
        && isSingleChar
        && (alreadyHasDot || !/^([0-9]+|,|\.)$/.test(event.key)) // Non numerical
      ) {
        event.preventDefault();
      }
    }

    function handleInput(payload: Event) {
      const { value } = payload.target as HTMLInputElement;
      emit('update:modelValue', props.type === 'number' ? value?.replace(',', '.') : value);
    }

    watch(
      () => focused.value,
      (val) => emit('focus-change', val),
    );

    return {
      focused,
      uid,
      inputId,
      inputMode,
      messageAsObject,
      hasError,
      hasWarning,
      showMessage,
      availableTextLimit,
      checkIfNumber,
      handleInput,
    };
  },
});
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
      margin: 4px 0;
      display: inline-block;
      user-select: none;
    }

    .btn-help {
      margin-left: 10px;
    }

    &-after {
      @extend %face-sans-15-regular;

      margin-left: auto;
      user-select: none;
      color: variables.$color-grey-dark;
    }
  }

  .input-wrapper {
    display: block;
    padding: 8px 12px;
    background-color: var(--color-bg);
    border: none;
    border-radius: variables.$border-radius-interactive;
    overflow: hidden;
    box-shadow: inset 0 0 0 2px var(--color-border);
    transition: 100ms ease-in-out;
    cursor: text;

    .main-inner {
      display: flex;
      align-items: center;
      width: 100%;

      :deep(.icon) {
        width: var(--size, 24px);
        height: var(--size, 24px);
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
        user-select: none;
      }

      &[type='number'] {
        -moz-appearance: textfield;
        appearance: textfield;

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
    @extend %face-sans-14-regular;

    min-height: 24px;
    line-height: 20px;
    display: flex;
    align-items: center;
    margin-top: 4px;
    text-align: left;
    color: var(--color-message);

    &-help {
      display: block;
      width: 24px;
      height: 24px;
      padding-left: 5px;
      color: rgba(variables.$color-black, 0.75);
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

  &.thin {
    .input {
      @extend %face-sans-14-regular;
    }
  }
}
</style>
