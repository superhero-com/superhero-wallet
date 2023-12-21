import BigNumber from 'bignumber.js';
import { computed, Ref } from 'vue';

import type {
  Balance,
  IAccountAsset,
  IAsset,
  ICoin,
} from '@/types';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';
import { useCurrencies } from './currencies';
import { useFungibleTokens } from './fungibleTokens';
import { useAccounts } from './accounts';
import { useMultisigAccounts } from './multisigAccounts';
import { useBalances } from './balances';

export interface UseTokensListOptions {
  /** Restrict the list to tokens owned by the user */
  ownedOnly?: boolean;
  /** Restrict the list to tokens with convertedBalance greater than 0 */
  withBalanceOnly?: boolean;
  /** Search the list by the symbol, name or contractId */
  searchTerm?: Ref<string>;
  /** Restrict the tokens list based on the account type */
  isMultisig?: boolean;
}

/**
 * Provides the access to searchable and filterable list of coin and fungible tokens
 * available for current active account.
 * The token list is extended with the actual balances.
 */
export function useAccountAssetsList({
  ownedOnly = false,
  withBalanceOnly = false,
  searchTerm,
  isMultisig = false,
}: UseTokensListOptions = {}) {
  const { marketData } = useCurrencies();
  const { balance } = useBalances();
  const { activeAccount } = useAccounts();
  const { activeMultisigAccount } = useMultisigAccounts();
  const {
    getAccountTokenBalances,
    getProtocolAvailableTokens,
  } = useFungibleTokens();

  const protocolCoinBalance = computed((): Balance => {
    const currentBalance = (isMultisig) ? activeMultisigAccount.value?.balance : balance.value;
    return currentBalance || new BigNumber(0);
  });

  const accountTokenBalances = computed(
    () => getAccountTokenBalances(activeAccount.value.address),
  );

  const accountAvailableTokens = computed(
    () => getProtocolAvailableTokens(activeAccount.value.protocol),
  );

  const accountTokenBalancesContractIds = computed(
    () => accountTokenBalances.value.map(({ contractId }) => contractId),
  );

  /**
   * Returns the default protocol coin meta information
   */
  const protocolCoin = computed(
    (): ICoin => ProtocolAdapterFactory
      .getAdapter(activeAccount.value.protocol)
      .getDefaultCoin(marketData.value!, +protocolCoinBalance.value),
  );

  /**
   * Protocol coin and all owned protocol tokens.
   */
  const accountAssets = computed<IAsset[]>(() => {
    const tokenAssetList: IAccountAsset[] = (isMultisig)
      ? []
      : Object.entries(accountAvailableTokens.value)
        .map(([contractId, tokenData]) => {
          const singleBalance = accountTokenBalances.value
            .find((tokenBalance) => tokenBalance.contractId === contractId);
          if (singleBalance) {
            return { ...tokenData, ...singleBalance };
          }
          return tokenData;
        });

    return [
      ...(protocolCoin.value ? [protocolCoin.value] : []),
      ...tokenAssetList,
    ];
  });

  /**
   * Filter the available assets with options provided for the composable and the search text
   */
  const accountAssetsFiltered = computed<IAsset[]>(() => {
    const searchTermParsed = (searchTerm?.value || '').trim().toLowerCase();
    const isSearchTermContract = searchTermParsed.startsWith('ct_');
    const protocolCoinContractId = ProtocolAdapterFactory
      .getAdapter(activeAccount.value.protocol)
      .getCoinContractId();

    return accountAssets.value
      .filter(({ contractId }) => (
        !ownedOnly
        || contractId === protocolCoinContractId
        || accountTokenBalancesContractIds.value.includes(contractId)
      ))
      .filter(({ contractId, convertedBalance }) => (
        !withBalanceOnly
        || contractId === protocolCoinContractId
        || +(convertedBalance || 0)
      ))
      .filter(({ contractId, symbol, name }) => (
        !searchTermParsed
        || symbol?.toLowerCase().includes(searchTermParsed)
        || name?.toLowerCase().includes(searchTermParsed)
        || (isSearchTermContract && contractId?.toLowerCase().includes(searchTermParsed))
      ));
  });

  return {
    accountAssets,
    accountAssetsFiltered,
    protocolCoinBalance,
  };
}
