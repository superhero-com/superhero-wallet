import {
  ref, Ref,
} from 'vue';

interface IScrollConf {
  scrollConf: Ref<boolean | null>
  setScrollConf: (props: boolean | null) => void
}

const scrollConf = ref<boolean | null>(null);
/**
 *  Data comming from AccountDetailsTokens or AccountDetailsTransactions and will be passed
 *  to AccountDetailsBase in order to showFilters
 */
export function useScrollConfig(): IScrollConf {
  function setScrollConf(value: boolean | null) {
    scrollConf.value = value;
  }

  return {
    setScrollConf,
    scrollConf,
  };
}
