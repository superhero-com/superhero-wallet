<template>
  <div class="tokens-list">
    <TokensListItem
      v-for="value in filteredTokens"
      :key="value.contractId || value.id"
      :token-data="value"
    />
  </div>
</template>

<script lang="ts">
import { computed, defineComponent } from '@vue/composition-api';
import { useTokensList } from '../../../composables';
import TokensListItem from './TokensListItem.vue';

export default defineComponent({
  components: {
    TokensListItem,
  },
  props: {
    searchTerm: { type: String, default: '' },
  },
  setup(props, { root }) {
    const { filteredTokens } = useTokensList({
      store: root.$store,
      ownedOnly: true,
      searchTerm: computed(() => props.searchTerm),
    });

    return {
      filteredTokens,
    };
  },
});
</script>
