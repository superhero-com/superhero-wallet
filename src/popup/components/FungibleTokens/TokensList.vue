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
import {
  computed,
  defineComponent,
  onMounted,
} from '@vue/composition-api';
import {
  useAccounts,
  useFungibleTokens,
  useMultisigAccounts,
  useTokensList,
} from '../../../composables';
import TokensListItem from './TokensListItem.vue';

export default defineComponent({
  components: {
    TokensListItem,
  },
  props: {
    searchTerm: { type: String, default: '' },
    isMultisig: Boolean,
  },
  setup(props, { root }) {
    const { activeMultisigAccount } = useMultisigAccounts({ store: root.$store });
    const { account } = useAccounts({ store: root.$store });
    const currentAddress = computed(() => (
      props.isMultisig && activeMultisigAccount.value?.gaAccountId
        ? activeMultisigAccount.value.gaAccountId
        : account.value.address
    ));

    const { loadTokenBalances } = useFungibleTokens({
      store: root.$store,
      accountAddress: currentAddress.value,
    });

    const { filteredTokens } = useTokensList({
      store: root.$store,
      ownedOnly: true,
      searchTerm: computed(() => props.searchTerm),
      accountAddress: currentAddress.value,
    });

    onMounted(() => {
      if (currentAddress.value) {
        loadTokenBalances();
      }
    });

    return {
      filteredTokens,
    };
  },
});
</script>
