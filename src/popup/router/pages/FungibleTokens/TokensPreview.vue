<template>
  <div class="tokens-preview">
    <div class="menu">
      <a class="menu-item" :class="{ active: activeItem === 'tokens' }">
        <TokenPiles />
        {{ $t('pages.fungible-tokens.tokens') }}
      </a>
    </div>
    <SearchBar v-model="searchTerm" :placeholder="$t('pages.fungible-tokens.searchPlaceholder')" />
    <TabsMenu v-model="activeTab" :tabOptions="tabs" />
    <TokensList :show-my-tokens="activeTab === tabs[1].name" :searchTerm="searchTerm" />
  </div>
</template>

<script>
import TabsMenu from '../../components/TabsMenu';
import TokensList from '../../components/FungibleTokens/TokensList';
import TokenPiles from '../../../../icons/token-piles.svg?vue-component';
import SearchBar from '../../components/SearchBar';

export default {
  name: 'fungible-tokens',
  components: {
    TokenPiles,
    SearchBar,
    TabsMenu,
    TokensList,
  },
  data() {
    return {
      activeItem: 'tokens',
      searchTerm: '',
      activeTab: 'all',
      tabs: [
        {
          name: 'all',
          text: this.$t('pages.fungible-tokens.all'),
        },
        {
          name: 'my-tokens',
          text: this.$t('pages.fungible-tokens.myTokens'),
        },
      ],
    };
  },
};
</script>

<style lang="scss" scoped>
@import '../../../../styles/variables';

::v-deep {
  text-align: left;
}

.menu {
  margin-top: 3px;
  padding: 7px;
  background-color: $black-2;
}

.menu-item {
  color: $gray-2;
  padding: 10px 18px;
  font-size: 15px;
  font-weight: 500;
  display: inline-block;
  border-radius: 20px;
  text-decoration: none;

  svg {
    margin-right: 5px;
    vertical-align: sub;
  }

  &.active {
    color: $accent-color;
    background-color: $black-3;
  }
}
</style>
