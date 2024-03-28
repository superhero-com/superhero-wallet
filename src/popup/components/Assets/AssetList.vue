<template>
  <div class="tokens-list">
    <AssetListItem
      v-for="asset in accountAssetsFiltered"
      :key="asset.contractId"
      :asset="asset"
      :is-multisig="isMultisig"
    />
  </div>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue';
import { useAccountAssetsList } from '@/composables';
import AssetListItem from './AssetListItem.vue';

export default defineComponent({
  components: {
    AssetListItem,
  },
  props: {
    searchTerm: { type: String, default: '' },
    ownedOnly: Boolean,
    isMultisig: Boolean,
  },
  setup(props) {
    const { accountAssetsFiltered } = useAccountAssetsList({
      ownedOnly: props.ownedOnly,
      searchTerm: computed(() => props.searchTerm),
      isMultisig: props.isMultisig,
    });

    return {
      accountAssetsFiltered,
    };
  },
});
</script>
