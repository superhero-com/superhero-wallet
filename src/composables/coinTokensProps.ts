import {
  ComputedRef, computed, Ref, ref,
} from 'vue';
import { TokenProps } from '../types';

type ITokenProps = Partial<TokenProps>;

type ITokenDetail = Omit<TokenProps, 'isMultisig'>
type ITokenTransaction = Pick<TokenProps, 'contractId'|'isMultisig'>

interface ITokenPropsState {
  tokenProps: Ref<ITokenProps | null>
  tokenDetails: ComputedRef<ITokenDetail>
  tokenTransactions: ComputedRef<ITokenTransaction>
  setTokenProps: (props: ITokenProps | null) => void
}

const tokenProps = ref<ITokenProps | null>(null);
/**
 *  Data comming from a coin that will be passed to the tab components
 *  TokenDetails and  TokenTransaction when the user clicks in particular token asset.
 */
export function useTokenProps(): ITokenPropsState {
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
