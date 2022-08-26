<template>
  <div class="token-list-wrapper">
    <TokensList
      :search-term="searchTerm"
    />
  </div>
</template>

<script>
import TokensList from '../components/FungibleTokens/TokensList.vue';

export default {
  components: {
    TokensList,
  },
  props: {
    searchTerm: { type: String, default: '' },
  },
};
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';
@use '../../../styles/mixins';
@use '../../../styles/typography';

.token-list-wrapper {
  position: relative;
  padding-top: 4px;
}
</style>
