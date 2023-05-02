<template>
  <div class="number-select">
    <select
      v-if="modelValue"
      :value="modelValue"
      class="number-select-input"
      @change="$emit('update:modelValue', +($event?.target as HTMLInputElement).value)"
    >
      <option
        v-for="idx of size"
        :key="idx"
        :value="idx"
        :selected="idx === modelValue"
      >
        {{ idx }}
      </option>
    </select>
    <ChevronDownIcon class="chevron-icon" />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

import ChevronDownIcon from '../../../icons/chevron-down.svg?vue-component';

export default defineComponent({
  components: {
    ChevronDownIcon,
  },
  props: {
    size: { type: Number, required: true },
    modelValue: { type: Number, required: true },
  },
  emits: ['update:modelValue'],
});
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';
@use '../../../styles/typography';

.number-select {
  position: relative;

  &-input {
    @extend %face-sans-14-regular;

    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
    outline: none;
    box-shadow: none;
    color: rgba(variables.$color-white, 0.75);
    background-color: rgba(variables.$color-white, 0.08);
    border: 2px solid transparent;
    border-radius: 10px;
    padding: 6px 22px 6px 10px;
    transition: all 0.12s ease-out;
    cursor: pointer;

    &:hover {
      color: variables.$color-white;
      background-color: rgba(variables.$color-white, 0.05);
      border-color: rgba(variables.$color-white, 0.15);
    }

    &:focus {
      font-weight: 500;
      color: variables.$color-white;
      background-color: rgba(variables.$color-black, 0.44);
      border-color: variables.$color-primary;
    }
  }

  .chevron-icon {
    top: 50%;
    transform: translateY(-50%);
    right: 8px;
    width: 8px;
    position: absolute;
    color: rgba(variables.$color-white, 0.75);
    pointer-events: none;
  }
}
</style>
