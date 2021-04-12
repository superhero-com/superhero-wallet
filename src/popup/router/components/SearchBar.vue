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
.search-bar ::v-deep .container {
  border-radius: 0;
}
</style>
