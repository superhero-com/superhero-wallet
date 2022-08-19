<template>
  <InputField
    class="search-bar"
    v-bind="$attrs"
    v-on="$listeners"
    @input="$emit('input', $event)"
  >
    <Search
      v-if="!$attrs.value"
      slot="right"
    />
    <Eraser
      v-else
      slot="right"
      @click="$emit('input', '')"
    />
  </InputField>
</template>

<script>
import InputField from './InputField.vue';
import Search from '../../../icons/search.svg?vue-component';
import Eraser from '../../../icons/eraser.svg?vue-component';

export default {
  components: {
    InputField,
    Search,
    Eraser,
  },
};
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';

.search-bar {
  ::v-deep .main-wrapper main {
    background-color: rgba(variables.$color-white, 0.08);
    border: 2px solid transparent;
    border-radius: 10px;

    svg {
      color: rgba(variables.$color-white, 0.75);
    }

    &:focus-within {
      background-color: rgba(variables.$color-black, 0.44);
      border-color: variables.$color-blue;
    }
  }
}
</style>
