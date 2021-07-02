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
import InputField from './InputField';
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

.search-bar ::v-deep .wrapper:not(:focus-within) {
  border-radius: 0;
  background-color: variables.$color-bg-3;
}
</style>
