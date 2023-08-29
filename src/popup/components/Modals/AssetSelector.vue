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
      :class="['appearing-element', { visible: loading }]"
    />
    <div
      v-show="isFullyOpen"
      :class="['appearing-element', { visible: !loading }]"
    >
      <TokensListItem
        v-for="token in filteredTokens"
        :key="token.contractId || token.id"
        :token-data="token"
        :selected="isTokenSelected(token)"
        show-current-price
        prevent-navigation
        @click="resolve(token)"
      />
    </div>
    <BackToTop />
  </Modal>
</template>

<script lang="ts">
import {
  defineComponent,
  nextTick,
  PropType,
  ref,
} from 'vue';
import { useStore } from 'vuex';
import type { IToken, RejectCallback, ResolveCallback } from '../../../types';
import Modal from '../Modal.vue';
import TokensListItem from '../FungibleTokens/TokensListItem.vue';
import InputSearch from '../InputSearch.vue';
import BackToTop from '../BackToTop.vue';
import { useTokensList } from '../../../composables';

export default defineComponent({
  name: 'AssetSelector',
  components: {
    BackToTop,
    TokensListItem,
    Modal,
    InputSearch,
  },
  props: {
    resolve: { type: Function as PropType<ResolveCallback>, required: true },
    reject: { type: Function as PropType<RejectCallback>, required: true },
    selectedToken: { type: Object as PropType<IToken | null>, default: null },
    showTokensWithBalance: Boolean,
  },
  setup(props) {
    const store = useStore();
    const loading = ref(true);
    const searchTerm = ref('');
    const isFullyOpen = ref(false);

    const { filteredTokens } = useTokensList({
      store,
      searchTerm,
      withBalanceOnly: props.showTokensWithBalance,
    });

    function isTokenSelected(token: IToken): boolean {
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
      filteredTokens,
      isTokenSelected,
      onModalOpen,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';
@use '../../../styles/typography';
@use '../../../styles/mixins';

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

    &.visible {
      opacity: 1;
      z-index: 1;
    }
  }
}
</style>
