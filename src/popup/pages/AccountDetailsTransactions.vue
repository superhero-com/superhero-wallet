<template>
  <div class="transaction-list-wrapper">
    <TransactionList
      :search-term="searchTerm"
      display-filter
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
    searchTerm: { type: String, default: '' },
  },
};
</script>
