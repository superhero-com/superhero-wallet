<template>
  <div class="transaction-list-wrapper">
    <TransactionList
      :show-filters="showFilters"
      is-multisig
      show-search
    />
  </div>
</template>

<script>
import TransactionList from '../components/TransactionList.vue';

export default {
  components: {
    TransactionList,
  },
  props: {
    showFilters: Boolean,
  },
};
</script>

<style lang="scss" scoped>
.transaction-list-wrapper {
  --filter-top-offset: 175px;

  ::v-deep .filters {
    position: sticky;
    top: calc(var(--filter-top-offset) + env(safe-area-inset-top));
  }
}
</style>
