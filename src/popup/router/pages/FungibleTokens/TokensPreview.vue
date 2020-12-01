<template>
  <div class="tokens-preview">
    <div class="menu">
      <a class="menu-item" :class="{ active: activeItem === 'tokens' }">
        <TokenPiles />
        {{ $t('pages.fungible-tokens.tokens') }}
      </a>
    </div>
    <div class="search">
      <input
        v-model="searchTerm"
        :placeholder="$t('pages.fungible-tokens.searchPlaceholder')"
        type="text"
      />
      <Eraser v-if="searchTerm.length > 0" class="eracer-icon" @click="searchTerm = ''" />
      <Search v-else class="search-icon" />
    </div>
    <TabsMenu v-model="activeTab" :tabOptions="tabs" />
    <TokensList :show-my-tokens="activeTab === tabs[1].name" :searchTerm="searchTerm" />
  </div>
</template>

<script>
import TabsMenu from '../../components/TabsMenu';
import TokensList from '../../components/FungibleTokens/TokensList';
import TokenPiles from '../../../../icons/token-piles.svg?vue-component';
import Search from '../../../../icons/search.svg?vue-component';
import Eraser from '../../../../icons/eraser.svg?vue-component';

export default {
  name: 'fungible-tokens',
  components: {
    TokenPiles,
    Search,
    Eraser,
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

.tokens-preview {
  max-width: 357px;
  margin: 0 auto;
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

.search {
  display: flex;
  align-items: center;
  border: 1px solid transparent;

  &:focus-within {
    border-color: $secondary-color;
  }

  input {
    font-size: 14px;
    color: $white-1;
    height: 40px;
    padding: 0 15px;
    flex-grow: 1;

    &::placeholder {
      color: $gray-2;
    }

    &:focus {
      outline: none;
      border: none;

      ~ .search-icon {
        display: none;
      }
    }

    ~ * {
      margin-right: 15px;
    }
  }

  .search-icon {
    color: $accent-color;
  }

  .eracer-icon :hover {
    cursor: pointer;
  }
}
</style>
