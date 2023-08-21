import { computed, ref } from 'vue';
import { IFilterInputPayload, IFilters, ObjectValues } from '../types';
import { tg } from '../store/plugins/languages';

const FILTER_MODE = {
  all: 'all',
  in: 'in',
  out: 'out',
  dex: 'dex',
} as const;

type TransactionsFilterMode = ObjectValues<typeof FILTER_MODE>;

type TransactionsFilterPayload = IFilterInputPayload<TransactionsFilterMode>;

function createEmptyFilter(): TransactionsFilterPayload {
  return { rotated: true, key: FILTER_MODE.all };
}

const searchPhrase = ref<string>('');
const displayMode = ref<TransactionsFilterPayload>(createEmptyFilter());

export const useTransactionAndTokenFilter = () => {
  const isSearchBarAndFilterExpanded = computed(
    () => displayMode.value.key !== FILTER_MODE.all || !!searchPhrase.value.length,
  );

  const filtersConfig = ref<IFilters<ObjectValues<typeof FILTER_MODE>>>({
    all: { name: tg('common.all') },
    in: { name: tg('filters.in') },
    out: { name: tg('filters.out') },
    dex: { name: tg('filters.dex') },
  });

  function resetFilter() {
    searchPhrase.value = '';
    displayMode.value = createEmptyFilter();
  }

  return {
    searchPhrase,
    displayMode,
    isSearchBarAndFilterExpanded,
    filtersConfig,
    resetFilter,
    FILTER_MODE,
  };
};
