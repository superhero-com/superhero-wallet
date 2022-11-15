<template>
  <InputField
    class="input-search"
    v-bind="$attrs"
    v-on="$listeners"
    @input="$emit('input', $event)"
  >
    <template #after>
      <Search
        v-if="!$attrs.value"
      />
      <Eraser
        v-else
        @click="$emit('input', '')"
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
