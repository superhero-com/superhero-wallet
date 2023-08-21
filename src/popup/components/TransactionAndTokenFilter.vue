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
        ref="transactionFilter"
        class="filter-wrapper"
      >
        <InputSearch
          v-if="!hideSearch"
          v-model="searchPhrase"
          class="input-search"
          :placeholder="$t('pages.fungible-tokens.searchPlaceholder')"
          @focus-change="handleFocus"
        />
        <Filters
          v-if="!hideFilterButton"
          v-model="displayMode"
          class="filters"
          :filters="filtersConfig"
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
  ref, watch,
} from 'vue';
import { useRoute } from 'vue-router';
import {
  useTransactionAndTokenFilter,
} from '../../composables';
import InputSearch from './InputSearch.vue';
import Filters from './Filters.vue';
import { useViewport } from '../../composables/viewport';

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
    const transactionFilter = ref();
    const {
      isSearchBarAndFilterExpanded,
      searchPhrase,
      displayMode,
      filtersConfig,
    } = useTransactionAndTokenFilter();

    const { viewportElement } = useViewport();

    const scrollTopThreshold = 140;
    const maxHeight = ref(0);
    const firstRender = ref(true);
    const inputIsFocused = ref(false);

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

    watch(() => searchPhrase.value, () => {
      if (viewportElement.value && viewportElement.value.scrollTop > scrollTopThreshold) {
        viewportElement.value.scrollTo({ top: scrollTopThreshold, behavior: 'smooth' });
      }
    });

    onMounted(() => {
      if (showFilterBar.value) {
        maxHeight.value = (transactionFilter?.value as HTMLDivElement)?.clientHeight;
        firstRender.value = false;
      }
    });

    return {
      transactionFilter,
      searchPhrase,
      filtersConfig,
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
