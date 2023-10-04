import { computed, ref } from 'vue';
import { tg } from '@/popup/plugins/i18n';
import { IFilterInputPayload, IFilters, ObjectValues } from '../types';

const FILTER_MODE_BASE = {
  all: 'all',
  in: 'in',
  out: 'out',
} as const;

const FILTER_MODE = {
  ...FILTER_MODE_BASE,
  dex: 'dex',
} as const;

type TransactionsFilterModeBase = ObjectValues<typeof FILTER_MODE_BASE>;
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

  const filtersConfig = ref<IFilters<TransactionsFilterModeBase>>({
    all: { name: tg('common.all') },
    in: { name: tg('filters.in') },
    out: { name: tg('filters.out') },
  });

  const filtersConfigAe = ref<IFilters<TransactionsFilterMode>>({
    ...filtersConfig.value,
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
    filtersConfigAe,
    resetFilter,
    FILTER_MODE,
  };
};
