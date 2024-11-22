<template>
  <Modal
    full-screen
    from-bottom
    has-close-button
    initialize-viewport
    no-padding
    class="asset-selector"
    @close="reject()"
  >
    <template #header>
      <span
        class="text-heading-5 text-muted title"
        v-text="$t('pages.fungible-tokens.select-asset')"
      />
      <InputSearch
        v-model="searchTerm"
        class="search-bar"
        :placeholder="$t('pages.fungible-tokens.searchAssetsPlaceholder')"
      />
    </template>

    <InfiniteScroll
      class="list"
      data-cy="list"
      @load-more="pageNumber += 1"
    >
      <AssetListItem
        v-for="asset in accountAssetsToDisplay"
        :key="asset.contractId"
        :asset="asset"
        :selected="isAssetSelected(asset)"
        prevent-navigation
        @click="resolve(asset)"
      />
    </InfiniteScroll>
  </Modal>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  PropType,
  ref,
  watch,
} from 'vue';
import type {
  IAsset,
  Protocol,
  RejectCallback,
  ResolveCallback,
} from '@/types';
import { useAccountAssetsList } from '@/composables';
import { ASSETS_PER_PAGE } from '@/constants';

import Modal from '../Modal.vue';
import AssetListItem from '../Assets/AssetListItem.vue';
import InputSearch from '../InputSearch.vue';
import InfiniteScroll from '../InfiniteScroll.vue';

export type AssetSelectorResolvedVal = IAsset;

export default defineComponent({
  name: 'AssetSelector',
  components: {
    AssetListItem,
    Modal,
    InputSearch,
    InfiniteScroll,
  },
  props: {
    resolve: {
      type: Function as PropType<ResolveCallback<AssetSelectorResolvedVal>>,
      required: true,
    },
    reject: { type: Function as PropType<RejectCallback>, required: true },
    selectedToken: { type: Object as PropType<IAsset>, default: null },
    protocol: { type: String as PropType<Protocol>, default: null },
    withBalanceOnly: Boolean,
  },
  setup(props) {
    const searchTerm = ref('');
    const isFullyOpen = ref(false);
    const pageNumber = ref(1);

    const { accountAssetsFiltered } = useAccountAssetsList({
      searchTerm,
      withBalanceOnly: props.withBalanceOnly,
    });

    const accountAssetsToDisplay = computed(() => (
      (props.protocol)
        ? accountAssetsFiltered.value.filter(({ protocol }) => protocol === props.protocol)
        : accountAssetsFiltered.value
    )
      .slice(0, pageNumber.value * ASSETS_PER_PAGE));

    function isAssetSelected(token: IAsset): boolean {
      return !!props.selectedToken && props.selectedToken.contractId === token.contractId;
    }
    watch(
      searchTerm,
      () => {
        pageNumber.value = 1;
      },
    );

    return {
      accountAssetsToDisplay,
      isFullyOpen,
      pageNumber,
      searchTerm,
      isAssetSelected,
    };
  },
});
</script>

<style lang="scss" scoped>
.asset-selector {
  padding-top: env(safe-area-inset-top);

  .search-bar {
    margin: 8px 8px 16px;
  }

  .title {
    margin-left: 16px;
    margin-bottom: 0;
    line-height: 48px;
    text-align: left;
  }
}
</style>
