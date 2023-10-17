<template>
  <div class="tokens-list">
    <TokensListItem
      v-for="value in filteredTokens"
      :key="value.contractId || value.id"
      :token-data="value"
      :is-multisig="isMultisig"
    />
  </div>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue';
import { useTokensList } from '@/composables';
import TokensListItem from './TokensListItem.vue';

export default defineComponent({
  components: {
    TokensListItem,
  },
  props: {
    searchTerm: { type: String, default: '' },
    isMultisig: Boolean,
  },
  setup(props) {
    const { filteredTokens } = useTokensList({
      ownedOnly: true,
      searchTerm: computed(() => props.searchTerm),
      isMultisig: props.isMultisig,
    });

    return {
      filteredTokens,
    };
  },
});
</script>
