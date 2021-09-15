<template>
  <div class="transactions">
    <AccountSwitcher />
    <SearchBar
      v-model="searchTerm"
      :placeholder="$t('pages.transactions.search')"
    />
    <TransactionList :search-term="searchTerm" />
  </div>
</template>

<script>
import AccountSwitcher from '../components/AccountSwitcher';
import SearchBar from '../components/SearchBar';
import TransactionList from '../components/TransactionList';

export default {
  components: {
    AccountSwitcher,
    SearchBar,
    TransactionList,
  },
  data() {
    return {
      searchTerm: '',
    };
  },
};
</script>

<style lang="scss" scoped>
.transactions {
  display: flex;
  flex-direction: column;
  min-height: 100%;

  .transaction-list {
    flex-grow: 1;
  }
}
</style>
