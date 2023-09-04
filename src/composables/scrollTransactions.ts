import {
  ref, Ref,
} from 'vue';

interface IScrollConf {
  scrollConf: Ref<Boolean | null>
  setScrollConf: (props: Boolean | null) => void
}

const scrollConf = ref<Boolean | null>(null);
/**
 *  Data comming from AccountDetailsTokens or AccountDetailsTransactions and will be passed
 *  to AccountDetailsBase in order to showFilters
 */
export function useScrollConfig(): IScrollConf {
  function setScrollConf(value: Boolean | null) {
    scrollConf.value = value;
  }

  return {
    setScrollConf,
    scrollConf,
  };
}
