<template>
  <div class="form-select-options-header">
    <span class="text-heading-5 text-muted title">{{ title }}</span>
    <InputSearch
      v-if="optionsLength > SHOW_SEARCH_THRESHOLD && !hideSearch"
      :value="value"
      :placeholder="searchPlaceholder || $t('common.search')"
      class="search-field"
      @update:modelValue="filterOptions"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import InputSearch from './InputSearch.vue';

const SHOW_SEARCH_THRESHOLD = 3;

export default defineComponent({
  components: { InputSearch },
  props: {
    value: { type: String, default: '' },
    title: { type: String, default: '' },
    optionsLength: { type: Number, default: 0 },
    searchPlaceholder: { type: String, default: '' },
    hideSearch: Boolean,
  },
  setup(props, { emit }) {
    function filterOptions(searchPhrase: string) {
      emit('update:modelValue', searchPhrase ? searchPhrase.toLowerCase() : '');
    }

    return {
      filterOptions,
      SHOW_SEARCH_THRESHOLD,
    };
  },
});
</script>

<style lang="scss" scoped>
.form-select-options-header {
  text-align: left;

  .title {
    padding-left: 12px;
    line-height: 48px;
  }

  .search-field {
    margin: 0 8px var(--gap);
  }
}
</style>
