import { computed, ref, Ref } from '@vue/composition-api';
import type { IToken, IDefaultComposableOptions } from '../types';
import { AETERNITY_CONTRACT_ID } from '../popup/utils';
import { useFungibleTokens } from './fungibleTokens';

export interface UseTokensListOptions extends IDefaultComposableOptions {
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
  /**
   * Restrict the list to this account address.
   */
  accountAddress: string
}

export function useTokensList({
  store,
  ownedOnly = false,
  withBalanceOnly = false,
  searchTerm = ref(''),
  accountAddress,
}: UseTokensListOptions) {
  const {
    availableTokens,
    tokenBalances,
    aeternityToken,
  } = useFungibleTokens({ store, accountAddress });

  /**
   * Converts the token information object into an array and put the AE at the beginning
   */
  const allTokens = computed<IToken[]>(() => {
    const tokens: IToken[] = Object.entries(availableTokens.value)
      .map(([contractId, tokenData]) => ({ ...tokenData, contractId }));

    tokenBalances.value.forEach((singleBalance: IToken) => {
      const index = tokens.findIndex((token) => token.contractId === singleBalance?.contractId);
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
    allTokens,
    filteredTokens,
  };
}
