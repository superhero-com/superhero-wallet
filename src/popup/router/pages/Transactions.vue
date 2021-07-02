<template>
  <div class="transactions">
    <AccountInfo />
    <BalanceInfo />
    <SearchBar
      v-model="searchTerm"
      :placeholder="$t('pages.transactions.search')"
    />
    <TransactionList :search-term="searchTerm" />
  </div>
</template>

<script>
import AccountInfo from '../components/AccountInfo';
import BalanceInfo from '../components/BalanceInfo';
import SearchBar from '../components/SearchBar';
import TransactionList from '../components/TransactionList';

export default {
  components: {
    AccountInfo,
    BalanceInfo,
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
