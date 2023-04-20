import { computed, ref } from '@vue/composition-api';
import { IFilterInputPayload, IFilters, ObjectValues } from '../types';
import { i18n } from '../store/plugins/languages';

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
    all: { name: i18n.t('filters.all') },
    in: { name: i18n.t('filters.in') },
    out: { name: i18n.t('filters.out') },
    dex: { name: i18n.t('filters.dex') },
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
