import { computed, ref, Ref } from '@vue/composition-api';
import type { Store } from 'vuex';
import type { IToken, ITokenList } from '../types';
import { AETERNITY_CONTRACT_ID } from '../popup/utils';
import { useBalances } from './balances';

export interface UseTokensListOptions {
  /**
   * TODO: Temporary solution to avoid dependency circle
   */
  store: Store<any>
  /**
   * Restrict the list to tokens owned by the user
   */
  ownedOnly?: boolean
  /**
   * Restrict the list to tokens with convertedBalance greater than 0
   */
  withBalanceOnly?: boolean
  /**
   * Search the list by the symbol, name or contractId
   */
  searchTerm?: Ref<string>
}

export function useTokensList({
  store,
  ownedOnly = false,
  withBalanceOnly = false,
  searchTerm = ref(''),
}: UseTokensListOptions) {
  const { balance, balanceCurrency } = useBalances({ store });

  const availableTokens = computed<ITokenList>(
    () => (store.state as any).fungibleTokens.availableTokens,
  );
  const tokenBalances = computed<IToken[]>(() => store.getters['fungibleTokens/tokenBalances']);
  const getAeternityToken = computed(() => store.getters['fungibleTokens/getAeternityToken']);

  /**
   * Returns the default aeternity meta information
   */
  const aeternityToken = computed<IToken | null>(() => getAeternityToken.value({
    tokenBalance: balance.value,
    balanceCurrency: balanceCurrency.value,
  }));

  /**
   * Converts the token information object into an array and put the AE at the beginning
   */
  const allTokens = computed<IToken[]>(() => {
    const tokens: IToken[] = Object.entries(availableTokens.value)
      .map(([contractId, tokenData]) => ({ ...tokenData, contractId }));

    tokenBalances.value.forEach((singleBalance: IToken) => {
      const index = tokens.findIndex((token) => token.contractId === singleBalance.contractId);
      if (index !== -1) {
        tokens[index] = singleBalance;
      }
    });

    return [
      ...(aeternityToken.value ? [aeternityToken.value] : []),
      ...tokens,
    ];
  });

  /**
   * Filter the available tokens with options provided for the composable and the search text
   */
  const filteredTokens = computed<IToken[]>(() => {
    const searchTermParsed = searchTerm.value.trim().toLowerCase();
    return allTokens.value
      .filter((token) => (
        !ownedOnly
        || token.contractId === AETERNITY_CONTRACT_ID
        || tokenBalances.value.includes(token)
      ))
      .filter((token) => (
        !withBalanceOnly
        || token.contractId === AETERNITY_CONTRACT_ID
        || (token.convertedBalance && +token.convertedBalance)
      ))
      .filter(({ symbol, name, contractId }) => (
        !searchTermParsed
        || symbol.toLowerCase().includes(searchTermParsed)
        || name.toLowerCase().includes(searchTermParsed)
        || (
          searchTermParsed.startsWith('ct_')
          && contractId.toLowerCase().includes(searchTermParsed)
        )
      ));
  });

  return {
    aeternityToken,
    allTokens,
    filteredTokens,
  };
}
