import { ref } from 'vue';

const isScrollEnabled = ref<boolean>(false);

/**
 * Data coming from AccountDetailsTokens or AccountDetailsTransactions and will be passed
 * to AccountDetailsBase in order to showFilters
 */
export function useScrollConfig() {
  function setScrollConf(value: boolean) {
    isScrollEnabled.value = value;
  }

  return {
    setScrollConf,
    isScrollEnabled,
  };
}
