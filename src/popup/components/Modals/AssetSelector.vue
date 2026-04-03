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
    <div
      v-else-if="showSearchSpinner"
      class="search-status"
    >
      <AnimatedSpinner class="spinner spinner-sm" />
      <span v-text="$t('pages.fungible-tokens.searching')" />
    </div>
    <div
      v-else-if="showEmptyState"
      class="empty-state"
    >
      <span
        class="text-heading-6"
        v-text="emptyStateTitle"
      />
      <span
        class="text-body-2 text-muted"
        v-text="emptyStateMessage"
      />
    </div>
    <div
      v-else
      class="list-container"
    >
      <InfiniteScroll
        :key="listKey"
        class="list"
        data-cy="list"
        :virtual="shouldUseVirtualScroll"
        :items="accountAssetsToDisplay"
        :key-extractor="assetKey"
        @load-more="handleLoadMore"
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
      <div
        v-if="showInlineSearchSpinner"
        class="inline-search-status"
      >
        <AnimatedSpinner class="spinner spinner-inline" />
        <span v-text="$t('pages.fungible-tokens.searching')" />
      </div>
    </div>
  </Modal>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  onBeforeUnmount,
  onMounted,
  PropType,
  ref,
  watch,
} from 'vue';
import { useI18n } from 'vue-i18n';
import { debounce, uniqBy } from 'lodash-es';
import type {
  IAsset,
  IToken,
  Protocol,
  RejectCallback,
  ResolveCallback,
} from '@/types';
import { useAccountAssetsList, useFungibleTokens } from '@/composables';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';
import AnimatedSpinner from '@/icons/animated-spinner.svg?vue-component';
import {
  getAssetIdentityKey,
  getAssetSelectorDisplayList,
  getAssetSelectorListKey,
  getAssetSelectorSearchMode,
  resolveSearchNextPageUrl,
} from './assetSelectorSearch';

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
    const { t } = useI18n();
    const searchTerm = ref('');
    const isSearching = ref(false);
    const isRemotePrefixSearchPending = ref(false);
    const remoteSearchResults = ref<IAsset[]>([]);
    const searchNextPageUrls = ref<{ name?: string | null; symbol?: string | null }>({});
    let searchRequestId = 0;

    const {
      loadAvailableTokens,
      loadSingleToken,
      isAvailableTokensLoading,
    } = useFungibleTokens();

    const { accountAssetsFiltered } = useAccountAssetsList({
      searchTerm,
      withBalanceOnly: props.withBalanceOnly,
    });

    const trimmedSearchTerm = computed(() => searchTerm.value.trim());
    const searchMode = computed(() => getAssetSelectorSearchMode(
      trimmedSearchTerm.value,
      props.protocol,
      props.withBalanceOnly,
    ));
    const isExactContractSearch = computed(() => searchMode.value === 'exact-contract');
    const isRemotePrefixSearch = computed(() => searchMode.value === 'remote-prefix');

    const accountAssetsToDisplay = computed(() => getAssetSelectorDisplayList(
      accountAssetsFiltered.value,
      remoteSearchResults.value,
      props.protocol,
      searchMode.value,
    ));

    const shouldUseVirtualScroll = computed(
      () => searchMode.value !== 'remote-prefix',
    );
    const listKey = computed(() => getAssetSelectorListKey(
      props.protocol,
      searchMode.value,
      trimmedSearchTerm.value,
    ));

    const showLoading = computed(
      () => !props.withBalanceOnly
        && isAvailableTokensLoading.value
        && !trimmedSearchTerm.value
        && !accountAssetsToDisplay.value.length,
    );

    const showSearchSpinner = computed(
      () => !!trimmedSearchTerm.value
        && (isSearching.value || isRemotePrefixSearchPending.value)
        && !accountAssetsToDisplay.value.length,
    );

    const showInlineSearchSpinner = computed(
      () => !!trimmedSearchTerm.value
        && isSearching.value
        && !!accountAssetsToDisplay.value.length,
    );

    const showEmptyState = computed(
      () => !!trimmedSearchTerm.value
        && !showSearchSpinner.value
        && !isRemotePrefixSearchPending.value
        && !accountAssetsToDisplay.value.length,
    );

    const emptyStateTitle = computed(() => (
      isExactContractSearch.value
        ? t('pages.fungible-tokens.contractSearchEmptyTitle')
        : t('pages.fungible-tokens.searchEmptyTitle')
    ));

    const emptyStateMessage = computed(() => (
      isExactContractSearch.value
        ? t('pages.fungible-tokens.contractSearchEmptyMessage')
        : t('pages.fungible-tokens.searchLimitationsMessage')
    ));

    function isAssetSelected(token: IAsset): boolean {
      return !!props.selectedToken
        && getAssetIdentityKey(props.selectedToken) === getAssetIdentityKey(token);
    }

    function resetRemoteSearchState() {
      remoteSearchResults.value = [];
      searchNextPageUrls.value = {};
    }

    async function loadRemotePrefixSearchResults(
      { loadMore = false }: { loadMore?: boolean } = {},
    ) {
      if (!props.protocol || !isRemotePrefixSearch.value) {
        resetRemoteSearchState();
        return;
      }

      const adapter = ProtocolAdapterFactory.getAdapter(props.protocol);
      if (!adapter.fetchAvailableTokensSearchPage) {
        resetRemoteSearchState();
        return;
      }

      if (
        loadMore
        && searchNextPageUrls.value.name === null
        && searchNextPageUrls.value.symbol === null
      ) {
        return;
      }

      if (loadMore && isSearching.value) {
        return;
      }

      const prevSearchNextPageUrls = { ...searchNextPageUrls.value };
      if (!loadMore) {
        searchNextPageUrls.value = {};
      }

      const currentSearchId = searchRequestId + 1;
      searchRequestId = currentSearchId;
      isSearching.value = true;
      try {
        const [nameResponse, symbolResponse] = await Promise.all(
          (['name', 'symbol'] as const).map(async (searchBy) => {
            const nextPageUrl = loadMore ? searchNextPageUrls.value[searchBy] : undefined;

            if (loadMore && nextPageUrl === null) {
              return null;
            }

            return adapter.fetchAvailableTokensSearchPage!(
              trimmedSearchTerm.value,
              searchBy,
              nextPageUrl || undefined,
            );
          }),
        );

        if (searchRequestId !== currentSearchId) {
          return;
        }

        searchNextPageUrls.value = {
          name: resolveSearchNextPageUrl(
            nameResponse,
            prevSearchNextPageUrls.name,
            loadMore,
          ),
          symbol: resolveSearchNextPageUrl(
            symbolResponse,
            prevSearchNextPageUrls.symbol,
            loadMore,
          ),
        };

        remoteSearchResults.value = uniqBy(
          [
            ...(loadMore ? remoteSearchResults.value : []),
            ...((nameResponse?.data || []) as IToken[]),
            ...((symbolResponse?.data || []) as IToken[]),
          ],
          'contractId',
        );
      } finally {
        if (searchRequestId === currentSearchId) {
          isSearching.value = false;
        }
      }
    }

    async function handleLoadMore() {
      if (props.withBalanceOnly || !props.protocol) {
        return;
      }

      if (isRemotePrefixSearch.value) {
        await loadRemotePrefixSearchResults({ loadMore: true });
        return;
      }

      if (isAvailableTokensLoading.value || trimmedSearchTerm.value) {
        return;
      }

      await loadAvailableTokens({
        protocol: props.protocol,
        loadMore: true,
      });
    }

    const handleSearchTermChangeDebounced = debounce(async () => {
      isRemotePrefixSearchPending.value = false;
      if (!isRemotePrefixSearch.value) {
        return;
      }

      await loadRemotePrefixSearchResults();
    }, 250);

    watch(searchTerm, async (value) => {
      const trimmedValue = value.trim();

      if (!trimmedValue) {
        handleSearchTermChangeDebounced.cancel();
        searchRequestId += 1;
        isSearching.value = false;
        isRemotePrefixSearchPending.value = false;
        resetRemoteSearchState();
        return;
      }

      if (isExactContractSearch.value) {
        handleSearchTermChangeDebounced.cancel();
        isRemotePrefixSearchPending.value = false;
        resetRemoteSearchState();
        const currentSearchId = searchRequestId + 1;
        searchRequestId = currentSearchId;
        isSearching.value = true;
        try {
          await loadSingleToken(trimmedValue, props.protocol!);
        } finally {
          if (searchRequestId === currentSearchId) {
            isSearching.value = false;
          }
        }
        return;
      }

      isRemotePrefixSearchPending.value = isRemotePrefixSearch.value;
      await handleSearchTermChangeDebounced();
    });

    onBeforeUnmount(() => {
      handleSearchTermChangeDebounced.cancel();
    });

    onMounted(() => {
      if (!props.withBalanceOnly) {
        loadAvailableTokens({ protocol: props.protocol });
      }
    });

    return {
      accountAssetsToDisplay,
      showLoading,
      showSearchSpinner,
      showInlineSearchSpinner,
      showEmptyState,
      searchTerm,
      emptyStateTitle,
      emptyStateMessage,
      shouldUseVirtualScroll,
      listKey,
      isAssetSelected,
      handleLoadMore,
      assetKey: getAssetIdentityKey,
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

  .search-status,
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: 220px;
    padding: 24px;
    text-align: center;
  }

  .search-status {
    .spinner-sm {
      width: 48px;
      height: 48px;
    }
  }

  .list-container {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .inline-search-status {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px 16px 20px;
    color: rgba(255, 255, 255, 0.75);

    .spinner-inline {
      width: 24px;
      height: 24px;
    }
  }
}
</style>
