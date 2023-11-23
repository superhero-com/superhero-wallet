<template>
  <div class="tokens-list">
    <TokensListItem
      v-for="token in tokensToDisplay"
      :key="token.contractId"
      :token-data="token"
      :is-multisig="isMultisig"
    />
  </div>
</template>

<script lang="ts">
import { PropType, computed, defineComponent } from 'vue';
import type { Protocol } from '@/types';
import { useTokensList } from '@/composables';
import TokensListItem from './TokensListItem.vue';

export default defineComponent({
  components: {
    TokensListItem,
  },
  props: {
    searchTerm: { type: String, default: '' },
    protocol: { type: String as PropType<Protocol>, default: null },
    ownedOnly: Boolean,
    isMultisig: Boolean,
  },
  setup(props) {
    const { filteredTokens } = useTokensList({
      ownedOnly: props.ownedOnly,
      searchTerm: computed(() => props.searchTerm),
      isMultisig: props.isMultisig,
    });

    const tokensToDisplay = computed(() => (props.protocol)
      ? filteredTokens.value.filter(({ protocol }) => protocol === props.protocol)
      : filteredTokens.value);

    return {
      tokensToDisplay,
    };
  },
});
</script>
