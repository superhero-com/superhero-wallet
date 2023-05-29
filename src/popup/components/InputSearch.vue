<template>
  <InputField
    class="input-search"
    v-bind="$attrs"
    thin
    @update:modelValue="$emit('update:modelValue', $event)"
  >
    <template #after>
      <Search
        v-if="!$attrs.value"
      />
      <Eraser
        v-else
        class="erase-icon"
        @click="$emit('update:modelValue', '')"
      />
    </template>
  </InputField>
</template>

<script>
import InputField from './InputField.vue';
import Search from '../../icons/search.svg?vue-component';
import Eraser from '../../icons/eraser.svg?vue-component';

export default {
  components: {
    InputField,
    Search,
    Eraser,
  },
};
</script>

<style lang="scss" scoped>
.input-search {
  .erase-icon {
    cursor: pointer;

    &:hover {
      opacity: 0.8;
    }
  }
}
</style>
