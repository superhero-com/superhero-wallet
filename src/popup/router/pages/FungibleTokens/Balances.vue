<template>
  <div class="balances">
    <Plate>
      <AccountSwitcher />
      <SearchBar
        slot="bottom"
        v-model="searchTerm"
        :placeholder="$t('pages.fungible-tokens.searchPlaceholder')"
      />
    </Plate>
    <TokensList :search-term="searchTerm" />
  </div>
</template>

<script>
import Plate from '../../components/Plate';
import AccountSwitcher from '../../components/AccountSwitcher';
import SearchBar from '../../components/SearchBar';
import TokensList from '../../components/FungibleTokens/TokensList';

export default {
  components: {
    Plate,
    AccountSwitcher,
    SearchBar,
    TokensList,
  },
  data() {
    return {
      searchTerm: '',
    };
  },
};
</script>
