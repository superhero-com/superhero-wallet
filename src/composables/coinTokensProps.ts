import { computed } from 'vue';
import type { TokenProps } from '@/types';
import { STORAGE_KEYS } from '@/constants';
import { useStorageRef } from './storageRef';

type ITokenProps = Partial<TokenProps>;

type ITokenDetail = Omit<TokenProps, 'isMultisig'>
type ITokenTransaction = Pick<TokenProps, 'contractId' | 'isMultisig'>

/**
 * Save last used token props in local storage
 * in order to have data available if user refreshes the page
 */
const tokenProps = useStorageRef<ITokenProps | null>(
  null,
  STORAGE_KEYS.tokenProps,
);

/**
 *  Data coming from a coin that will be passed to the tab components
 *  TokenDetails and TokenTransaction when the user clicks in particular token asset.
 */
export function useTokenProps() {
  function setTokenProps(props: ITokenProps | null) {
    tokenProps.value = props;
  }

  const tokenDetails = computed<ITokenDetail>(() => ({
    contractId: tokenProps.value?.contractId ?? '',
    tokenPairs: tokenProps.value?.tokenPairs ?? {},
    tokenData: tokenProps.value?.tokenData ?? {},
    tokens: tokenProps.value?.tokens ?? [],
  }));
  const tokenTransactions = computed<ITokenTransaction>(() => ({
    contractId: tokenProps.value?.contractId ?? '',
    isMultisig: tokenProps.value?.isMultisig ?? false,
  }));

  return {
    tokenTransactions,
    tokenDetails,
    tokenProps,
    setTokenProps,
  };
}
