<template>
  <div class="token-list-wrapper">
    <div
      v-if="showFilters"
      class="search-bar-wrapper"
    >
      <InputSearch
        v-model="searchTerm"
        :placeholder="$t('pages.fungible-tokens.searchPlaceholder')"
      />
    </div>
    <TokensList
      :search-term="searchTerm"
    />
  </div>
</template>

<script>
import TokensList from '../components/FungibleTokens/TokensList.vue';
import InputSearch from '../components/InputSearch.vue';

export default {
  components: {
    TokensList,
    InputSearch,
  },
  props: {
    showFilters: Boolean,
  },
  data() {
    return {
      searchTerm: '',
    };
  },
};
</script>

<style lang="scss" scoped>
@use '../../styles/variables';
@use '../../styles/mixins';
@use '../../styles/typography';

.token-list-wrapper {
  position: relative;
  padding-top: 4px;
}
</style>
