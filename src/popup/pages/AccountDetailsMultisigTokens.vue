<template>
  <div class="token-list-wrapper">
    <TokensList
      :search-term="searchPhrase"
      is-multisig
    />
  </div>
</template>

<script>
import {
  defineComponent,
} from '@vue/composition-api';
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
.token-list-wrapper {
  position: relative;
  padding-top: 4px;
}

.search-bar-wrapper {
  background: var(--screen-bg-color);
  margin-left: calc(-1 * var(--screen-padding-x));
  margin-right: calc(-1 * var(--screen-padding-x));
  padding-inline: var(--screen-padding-x);
}
</style>
