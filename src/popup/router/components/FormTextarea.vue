<template>
  <InputField
    v-bind="$attrs"
    class="textarea"
    new-ui
    :class="[ size ]"
    @input="$emit('input', $event)"
  >
    <template #default="{ inputId }">
      <textarea
        :id="inputId"
        data-cy="textarea"
        :class="['textarea-input', { resizable }]"
        :placeholder="placeholder"
        :value="value"
        @keydown.enter="handleEnterClick"
        @input="$emit('input', $event.target.value)"
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

<script>
import InputField from './InputField.vue';

const SIZES = ['xs', 'sm', 'rg', 'md'];

export default {
  components: {
    InputField,
  },
  props: {
    type: { type: String, default: '' },
    value: { type: String, default: '' },
    error: Boolean,
    placeholder: { type: String, default: '' },
    enterSubmit: Boolean,
    resizable: { type: Boolean, default: true },
    size: {
      type: String,
      default: null,
      validator: (val) => SIZES.includes(val),
    },
  },
  methods: {
    handleEnterClick(event) {
      if (!this.enterSubmit) return;
      this.$emit('submit');
      event.preventDefault();
    },
  },
};
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';
@use '../../../styles/typography';

.textarea {
  --base-line-height: 1.4em;
  --size: 6; // Amount of text lines

  &-input {
    @extend %face-sans-16-regular;

    min-height: calc(var(--base-line-height) * var(--size));
    width: 100%;
    background: transparent;
    border: none;
    padding: 0;
    color: variables.$color-white;
    outline: none;
    word-break: break-word;
    font-size: 15px;
    line-height: var(--base-line-height);
    resize: none;

    &.resizable {
      resize: both;
    }
  }

  ::placeholder {
    color: variables.$color-silver;
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
}
</style>
