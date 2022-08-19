<template>
  <InputWrapper
    class="input-field"
    :class="{ readonly }"
    v-bind="$attrs"
  >
    <slot
      v-for="slot in Object.keys($slots)"
      :slot="slot"
      :name="slot"
    />
    <input
      class="input"
      v-bind="$attrs"
      autocomplete="off"
      :value="value"
      :data-cy="$attrs.type ? `input-${$attrs.type}` : 'input'"
      :disabled="readonly"
      step="any"
      @input="$emit('input', $event.target.value)"
    >
  </InputWrapper>
</template>

<script>
import InputWrapper from './InputWrapper.vue';

export default {
  components: { InputWrapper },
  props: {
    value: { type: [String, Number], default: null },
    readonly: Boolean,
  },
};
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';
@use '../../../styles/typography';

.input-field {
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

    color: variables.$color-light-grey;

    &::placeholder {
      @extend %face-sans-14-light;

      color: rgba(variables.$color-white, 0.75);
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
</style>
