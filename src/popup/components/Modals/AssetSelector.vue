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

    <div
      v-if="showLoading"
      class="spinner-wrap"
    >
      <AnimatedSpinner class="spinner" />
    </div>
    <InfiniteScroll
      v-else
      class="list"
      data-cy="list"
      :virtual="true"
      :items="accountAssetsToDisplay"
      :key-extractor="assetKey"
    >
      <template #default="{ item }">
        <AssetListItem
          :key="item.contractId"
          :asset="item"
          :selected="isAssetSelected(item)"
          prevent-navigation
          @click="resolve(item)"
        />
      </template>
    </InfiniteScroll>
  </Modal>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  onMounted,
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
import { useAccountAssetsList, useFungibleTokens } from '@/composables';
import AnimatedSpinner from '@/icons/animated-spinner.svg?vue-component';

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
    AnimatedSpinner,
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

    const { loadAvailableTokens, isAvailableTokensLoading } = useFungibleTokens();

    const { accountAssetsFiltered } = useAccountAssetsList({
      searchTerm,
      withBalanceOnly: props.withBalanceOnly,
    });

    const accountAssetsToDisplay = computed(() => (
      (props.protocol)
        ? accountAssetsFiltered.value.filter(({ protocol }) => protocol === props.protocol)
        : accountAssetsFiltered.value
    ));

    const showLoading = computed(() => !props.withBalanceOnly && isAvailableTokensLoading.value);

    function isAssetSelected(token: IAsset): boolean {
      return !!props.selectedToken && props.selectedToken.contractId === token.contractId;
    }
    watch(
      searchTerm,
      () => {
        pageNumber.value = 1;
      },
    );

    onMounted(() => {
      if (!props.withBalanceOnly) {
        loadAvailableTokens();
      }
    });

    return {
      accountAssetsToDisplay,
      showLoading,
      isFullyOpen,
      pageNumber,
      searchTerm,
      isAssetSelected,
      assetKey: (a: IAsset) => a.contractId,
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

  .spinner-wrap {
    display: flex;
    justify-content: center;
    height: calc(100vh - 120px);
    margin-top: 150px;

    .spinner {
      width: 100px;
      height: 100px;
    }
  }
}
</style>
