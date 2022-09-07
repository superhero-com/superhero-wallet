<template>
  <div class="tokens-list">
    <TokensListItem
      v-for="value in filteredResults"
      :key="value.contractId || value.id"
      :token-data="value"
    />
  </div>
</template>

<script>
import TokensListItem from './TokensListItem.vue';
import balanceListMixin from '../../../../mixins/balanceListMixin';

export default {
  components: {
    TokensListItem,
  },
  mixins: [balanceListMixin(false)],
  props: {
    searchTerm: { type: String, default: '' },
  },
};
</script>
