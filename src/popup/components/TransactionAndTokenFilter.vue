<template>
  <div
    v-if="showFilterBar"
    class="transaction-filter"
    :class="{ 'without-search': hideSearch }"
    :style="{ maxHeight: openHeight }"
  >
    <transition
      name="fade-transition"
      mode="out-in"
    >
      <div
        v-if="firstRender || openHeight"
        ref="transactionFilterEl"
        class="filter-wrapper"
      >
        <InputSearch
          v-if="!hideSearch && isActiveAccountAe"
          v-model="searchPhrase"
          class="input-search"
          :placeholder="$t('pages.fungible-tokens.searchPlaceholder')"
          @focus-change="handleFocus"
        />
        <Filters
          v-if="!hideFilterButton"
          v-model="displayMode"
          class="filters"
          :filters="isActiveAccountAe ? filtersConfigAe : filtersConfig"
          :scroll-top-threshold="scrollTopThreshold"
        />
      </div>
    </transition>
  </div>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  onMounted,
  onUnmounted,
  ref,
  watch,
} from 'vue';
import { useRoute } from 'vue-router';
import { PROTOCOLS } from '@/constants';
import {
  useAccounts,
  useTransactionAndTokenFilter,
  useViewport,
} from '@/composables';
import InputSearch from './InputSearch.vue';
import Filters from './Filters.vue';

export default defineComponent({
  name: 'TransactionAndTokenFilter',
  components: {
    Filters,
    InputSearch,
  },
  props: {
    showFilters: Boolean,
  },
  setup(props) {
    const route = useRoute();

    const {
      isSearchBarAndFilterExpanded,
      searchPhrase,
      displayMode,
      filtersConfig,
      filtersConfigAe,
      resetFilter,
    } = useTransactionAndTokenFilter();

    const { viewportElement } = useViewport();
    const { activeAccount } = useAccounts();

    const scrollTopThreshold = 140;
    const maxHeight = ref(0);
    const firstRender = ref(true);
    const inputIsFocused = ref(false);
    const transactionFilterEl = ref<HTMLDivElement>();
    const resizeObserver = ref<ResizeObserver>();

    const isActiveAccountAe = computed(() => activeAccount.value.protocol === PROTOCOLS.aeternity);

    const openHeight = computed(() => (
      props.showFilters
      || inputIsFocused.value
      || isSearchBarAndFilterExpanded.value
    )
      ? `${maxHeight.value}px`
      : 0);

    const showFilterBar = computed(() => !!route.meta?.showFilterBar);
    const hideSearch = computed(() => !!route.meta?.hideSearchBar);
    const hideFilterButton = computed(() => !!route.meta?.hideFilterButton);

    function handleFocus(val: boolean) {
      inputIsFocused.value = val;
    }

    function observeFilterElHeight() {
      resizeObserver.value = new ResizeObserver(() => {
        const clientHeight = (transactionFilterEl.value?.clientHeight || 0);
        if (clientHeight && clientHeight > 0) {
          maxHeight.value = clientHeight;
        }
      });
    }

    watch(transactionFilterEl, (value) => {
      if (value) {
        resizeObserver.value?.observe(value);
      } else {
        resizeObserver.value?.disconnect();
      }
    });

    watch(() => searchPhrase.value, () => {
      if (viewportElement.value && viewportElement.value.scrollTop > scrollTopThreshold) {
        viewportElement.value.scrollTo({ top: scrollTopThreshold, behavior: 'smooth' });
      }
    });

    onMounted(() => {
      if (showFilterBar.value) {
        maxHeight.value = (transactionFilterEl?.value)?.clientHeight!;
        firstRender.value = false;
        observeFilterElHeight();
      }
    });

    onUnmounted(() => resetFilter());

    return {
      transactionFilterEl,
      searchPhrase,
      filtersConfig,
      filtersConfigAe,
      isActiveAccountAe,
      openHeight,
      hideSearch,
      showFilterBar,
      hideFilterButton,
      displayMode,
      firstRender,
      scrollTopThreshold,
      handleFocus,
    };
  },
});
</script>

<style lang="scss" scoped>
.transaction-filter {
  max-height: 20px;
  overflow: hidden;
  transition: 150ms;

  .input-search {
    padding-top: 8px;
  }

  .filter-wrapper {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .filters {
    padding-bottom: 0;
    height: auto;
  }

  &.without-search {
    padding-top: 0;
  }
}
</style>
