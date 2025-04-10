<template>
  <InputField
    v-bind="$attrs"
    class="textarea"
    :class="[size, { 'auto-height': autoHeight }]"
    :readonly="readonly"
    :text-limit="textLimit"
    :model-value="modelValue"
    @update:modelValue="handleInput"
  >
    <template #default="{ inputId }">
      <textarea
        :id="inputId"
        ref="textarea"
        data-cy="textarea"
        class="textarea-input styled-scrollbar"
        :class="{ resizable: resizable && !autoHeight }"
        :style="{ height }"
        :placeholder="placeholder"
        :value="modelValue"
        :rows="1"
        :disabled="readonly"
        @keydown.enter.prevent="handleEnterClick"
        @input="(payload) => handleInput(payload as InputEvent)"
        @blur="handleBlur"
      />
    </template>

    <template
      v-for="(index, name) in $slots"
      #[name]
    >
      <slot :name="name" />
    </template>
  </InputField>
</template>

<script lang="ts">
import {
  defineComponent,
  ref,
  nextTick,
  watch,
  onMounted,
} from 'vue';
import InputField from '../InputField.vue';

const SIZES = ['xxs', 'xs', 'sm', 'rg', 'md'];

export default defineComponent({
  components: {
    InputField,
  },
  props: {
    type: { type: String, default: '' },
    modelValue: { type: String, default: '' },
    placeholder: { type: String, default: '' },
    textLimit: { type: Number, default: null },
    resizable: { type: Boolean, default: true },
    size: {
      type: String,
      default: null,
      validator: (val: string) => SIZES.includes(val),
    },
    enterSubmit: Boolean,
    autoHeight: Boolean,
    readonly: Boolean,
  },
  emits: ['update:modelValue', 'submit', 'blur'],
  setup(props, { emit }) {
    const textarea = ref<HTMLTextAreaElement>();
    const height = ref<string | undefined>();

    function handleInput(event: InputEvent) {
      const { value } = event.target as HTMLInputElement;
      emit('update:modelValue', value);
    }

    function handleBlur(event: InputEvent) {
      handleInput(event as unknown as InputEvent);
      emit('blur', event);
    }

    function handleEnterClick() {
      if (props.enterSubmit) {
        emit('submit');
      }
    }

    onMounted(() => {
      watch(() => props.modelValue, () => {
        if (props.autoHeight) {
          height.value = 'auto';
          nextTick(() => {
            if (textarea.value) {
              const { scrollHeight, clientHeight } = textarea.value!;
              const newHeight = clientHeight > scrollHeight ? clientHeight : scrollHeight;
              height.value = `${newHeight}px`;
            }
          });
        }
      }, { immediate: true });
    });

    return {
      textarea,
      height,
      handleInput,
      handleEnterClick,
      handleBlur,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;
@use '@/styles/typography';

.textarea {
  --base-line-height: 1.4em;
  --size: 6; // Amount of text lines

  &-input {
    @extend %face-sans-14-regular;

    min-height: calc(var(--base-line-height) * var(--size));
    width: 100%;
    background: transparent;
    border: none;
    padding: 0;
    color: $color-white;
    outline: none;
    word-break: break-word;
    line-height: var(--base-line-height);
    resize: none;

    &.resizable {
      resize: vertical;
    }
  }

  &.xs {
    --size: 3;
  }

  &.sm {
    --size: 4;
  }

  &.md {
    --size: 8;
  }

  &.auto-height, &.xxs {
    --size: 1;
  }
}
</style>
