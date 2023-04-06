<template>
  <div class="multisig-token-list-wrapper">
    <TokensList
      :search-term="searchPhrase"
      is-multisig
    />
  </div>
</template>

<script>
import {
  defineComponent,
} from 'vue';
import TokensList from '../components/FungibleTokens/TokensList.vue';
import { useTransactionAndTokenFilter } from '../../composables';

export default defineComponent({
  components: {
    TokensList,
  },
  props: {
    showFilters: Boolean,
  },
  setup() {
    const { searchPhrase } = useTransactionAndTokenFilter();

    return {
      searchPhrase,
    };
  },
});
</script>

<style lang="scss" scoped>
.multisig-token-list-wrapper {
  position: relative;
  padding-top: 4px;
}
</style>
