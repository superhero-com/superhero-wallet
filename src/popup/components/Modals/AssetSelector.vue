<template>
  <Modal
    full-screen
    from-bottom
    has-close-button
    no-padding
    class="asset-selector"
    @close="reject()"
    @open="onModalOpen"
  >
    <template #header>
      <span
        class="text-heading-3 text-muted title"
        v-text="$t('pages.fungible-tokens.select-asset')"
      />
      <InputSearch
        v-model="searchTerm"
        class="search-bar"
        :placeholder="$t('pages.fungible-tokens.searchAssetsPlaceholder')"
      />
    </template>

    <Loader
      class="appearing-element"
      :class="{ visible: loading }"
    />
    <div
      v-show="isFullyOpen"
      class="appearing-element"
      :class="{ visible: !loading }"
    >
      <AssetListItem
        v-for="asset in accountAssetsToDisplay"
        :key="asset.contractId"
        :asset="asset"
        :selected="isAssetSelected(asset)"
        show-current-price
        prevent-navigation
        @click="resolve(asset)"
      />
    </div>
  </Modal>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  nextTick,
  PropType,
  ref,
} from 'vue';
import type {
  IAsset,
  Protocol,
  RejectCallback,
  ResolveCallback,
} from '@/types';
import { useAccountAssetsList } from '@/composables';

import Modal from '../Modal.vue';
import AssetListItem from '../Assets/AssetListItem.vue';
import InputSearch from '../InputSearch.vue';
import Loader from '../Loader.vue';

export type AssetSelectorResolvedVal = IAsset;

export default defineComponent({
  name: 'AssetSelector',
  components: {
    AssetListItem,
    Modal,
    InputSearch,
    Loader,
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
    const loading = ref(true);
    const searchTerm = ref('');
    const isFullyOpen = ref(false);

    const { accountAssetsFiltered } = useAccountAssetsList({
      searchTerm,
      withBalanceOnly: props.withBalanceOnly,
    });

    const accountAssetsToDisplay = computed(() => (props.protocol)
      ? accountAssetsFiltered.value.filter(({ protocol }) => protocol === props.protocol)
      : accountAssetsFiltered.value);

    function isAssetSelected(token: IAsset): boolean {
      return !!props.selectedToken && props.selectedToken.contractId === token.contractId;
    }

    /**
     * Delay displaying tokens list until the modal transition is finished to prevent
     * performance issues when both animating the modal and rendering large amount of data.
     */
    async function onModalOpen() {
      await nextTick();
      isFullyOpen.value = true;
      setTimeout(() => {
        loading.value = false;
      }, 250);
    }

    return {
      loading,
      searchTerm,
      isFullyOpen,
      accountAssetsToDisplay,
      isAssetSelected,
      onModalOpen,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;
@use '@/styles/typography';
@use '@/styles/mixins';

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

  .appearing-element {
    width: 100%;
    opacity: 0;
    z-index: -1;
    transition: opacity 0.25s ease-in-out;
    padding-bottom: 40px; // Back-to-top button height

    &.visible {
      opacity: 1;
      z-index: 1;
    }
  }
}
</style>
