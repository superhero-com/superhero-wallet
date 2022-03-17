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
import Plate from '../../components/Plate.vue';
import AccountSwitcher from '../../components/AccountSwitcher.vue';
import SearchBar from '../../components/SearchBar.vue';
import TokensList from '../../components/FungibleTokens/TokensList.vue';

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
