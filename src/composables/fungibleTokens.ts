/* eslint-disable no-param-reassign */

import { computed, watch } from 'vue';
import { uniqBy, isEmpty } from 'lodash-es';
import BigNumber from 'bignumber.js';
import { Contract, Encoding, Tag } from '@aeternity/aepp-sdk';

import { isAssetCoin, toShiftedBigNumber } from '@/utils';
import type {
  AccountAddress,
  AssetContractId,
  AssetList,
  BigNumberPublic,
  IToken,
  ITokenBalance,
  ITransaction,
  ProtocolRecord,
  Protocol,
  Dictionary,
  ITx,
} from '@/types';
import { PROTOCOLS, STORAGE_KEYS, TX_DIRECTION } from '@/constants';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';

import FungibleTokenFullInterfaceACI from '@/protocols/aeternity/aci/FungibleTokenFullInterfaceACI.json';
import { AE_COIN_PRECISION } from '@/protocols/aeternity/config';
import { aettosToAe, categorizeContractCallTxObject, getTokenSaleBuyAmount } from '@/protocols/aeternity/helpers';

import { useCurrencies } from './currencies';
import { useAccounts } from './accounts';
import { useAeSdk } from './aeSdk';
import { useTippingContracts } from './tippingContracts';
import { createPollingBasedOnMountedComponents } from './composablesHelpers';
import { useStorageRef } from './storageRef';
import { useNetworks } from './networks';

let composableInitialized = false;

/**
 * List of all fungible tokens available on user's protocols.
 * Does not include custom tokens extracted from user's token balances.
 * As this list is quite big (hundreds of items) it requires processing optimizations.
 */
const defaultTokensAvailable = useStorageRef<ProtocolRecord<AssetList>>(
  {},
  STORAGE_KEYS.fungibleTokenList,
);

/**
 * List of user account's token asset balances.
 */
const tokenBalances = useStorageRef<ITokenBalance[]>(
  [],
  STORAGE_KEYS.fungibleTokenBalances,
);

/**
 * List of all fungible tokens available on user's protocols.
 * Includes tokens from the user's account that are not on the main list.
 */
const tokensAvailable = computed((): ProtocolRecord<AssetList> => {
  const uniqueTokens: IToken[] = uniqBy(tokenBalances.value, 'contractId')
    .map((tokenBalance) => ({
      contractId: tokenBalance.contractId,
      protocol: tokenBalance.protocol,
      name: tokenBalance?.name!,
      symbol: tokenBalance?.symbol!,
      price: tokenBalance.price,
    }));

  const customTokensAvailable = uniqueTokens.reduce((customTokens, token) => {
    const { contractId, protocol } = token;
    if (!customTokens[protocol]) {
      customTokens[protocol] = {} as AssetList;
    }
    if (!defaultTokensAvailable?.value?.[protocol]?.[contractId]) {
      customTokens[protocol]![contractId] = token;
    }
    return customTokens;
  }, {} as typeof tokensAvailable.value);

  return Object.values(PROTOCOLS).reduce((allTokens, protocol) => {
    allTokens[protocol] = {
      ...defaultTokensAvailable.value[protocol],
      ...customTokensAvailable[protocol],
    };
    return allTokens;
  }, {} as typeof defaultTokensAvailable.value);
});

function getProtocolAvailableTokens(protocol: Protocol): AssetList {
  return tokensAvailable.value[protocol] || {} as AssetList;
}

const availableTokensPooling = createPollingBasedOnMountedComponents(60000);
const tokenBalancesPooling = createPollingBasedOnMountedComponents(10000);

let areTokenBalancesUpdating = false;

/**
 * Store and provide the access to all protocol's fungible tokens.
 */
export function useFungibleTokens() {
  const { activeNetwork, onNetworkChange } = useNetworks();
  const { getAeSdk } = useAeSdk();
  const { tippingContractAddresses } = useTippingContracts();
  const {
    accounts,
    protocolsInUse,
    getLastActiveProtocolAccount,
  } = useAccounts();
  const { getCurrentCurrencyRate } = useCurrencies();

  function getAccountTokenBalances(address: AccountAddress): ITokenBalance[] {
    return tokenBalances.value.filter((token) => token.address === address) || [];
  }

  const accountsTotalTokenBalance = computed(
    () => accounts.value.reduce(
      (total, account) => {
        const accountTokenBalance = getAccountTokenBalances(account.address);
        if (isEmpty(accountTokenBalance)) {
          return total;
        }
        let accountTotal = 0;
        accountTokenBalance
          .filter((token) => token.price && token.convertedBalance)
          .forEach((token) => {
            if (token.convertedBalance && token.price) {
              accountTotal += new BigNumber(token.convertedBalance)
                .multipliedBy(token.price).toNumber();
            }
          });
        return total + (getCurrentCurrencyRate(account.protocol) * accountTotal);
      },
      0,
    ).toFixed(2),
  );

  function getAccountTokenBalance(
    address: AccountAddress,
    contractId: string,
  ): ITokenBalance | undefined {
    return getAccountTokenBalances(address)
      .find((tokenBalance) => tokenBalance.contractId === contractId);
  }

  async function loadAvailableTokens() {
    const tokensFetchPromises = protocolsInUse.value.map(
      (protocol) => ProtocolAdapterFactory.getAdapter(protocol).fetchAvailableTokens?.(),
    );
    const currentNetworkName = activeNetwork.value.name;
    // for each promise check if it returned null, if so, use cached data
    // because it means that we couldn't fetch new data
    const tokens: IToken[] = (await Promise.all(tokensFetchPromises)).map(
      (protocolTokens, index) => (
        protocolTokens
        || Object.values(defaultTokensAvailable.value[protocolsInUse.value[index]] || {})
      ),
    ).flat();

    // This is necessary in case the user switches between networks faster,
    // than the available tokens are returned (limitations of the free Ethereum middleware)
    if (currentNetworkName !== activeNetwork.value.name) {
      return;
    }

    defaultTokensAvailable.value = tokens.reduce((accumulator, token) => {
      const { contractId, protocol } = token;
      if (!accumulator[protocol]) {
        accumulator[protocol] = {} as AssetList;
      }
      accumulator[protocol]![contractId] = token;
      return accumulator;
    }, {} as typeof defaultTokensAvailable.value);
  }

  async function loadTokenBalances() {
    if (areTokenBalancesUpdating) {
      return;
    }

    areTokenBalancesUpdating = true;
    const tokenBalancesFetchPromisesByAddress: Dictionary<Promise<ITokenBalance[] | null>> = {};
    accounts.value.map(
      ({ address, protocol }) => {
        tokenBalancesFetchPromisesByAddress[address] = ProtocolAdapterFactory
          .getAdapter(protocol).fetchAccountTokenBalances?.(address) ?? [] as any;
        return null;
      },
    );

    // for each promise check if it returned null, if so, use cached data
    // because it means that we couldn't fetch new data
    const cachedTokenBalances = tokenBalances.value;

    const cachedTokenBalancesByAddress: Dictionary<ITokenBalance[]> = {};
    cachedTokenBalances.map(
      (tokenBalance) => {
        if (!cachedTokenBalancesByAddress[tokenBalance.address]) {
          cachedTokenBalancesByAddress[tokenBalance.address] = [];
        }
        cachedTokenBalancesByAddress[tokenBalance.address].push(tokenBalance);
        return null;
      },
    );

    tokenBalances.value = (await Promise.all(
      (Object.entries(tokenBalancesFetchPromisesByAddress)).map(
        async ([address, promise]) => await promise || cachedTokenBalancesByAddress[address] || [],
      ),
    )).flat();

    areTokenBalancesUpdating = false;
  }

  async function createOrChangeAllowance(contractId: AssetContractId, amount: number | string) {
    const aeSdk = await getAeSdk();
    const account = getLastActiveProtocolAccount(PROTOCOLS.aeternity);
    const tokenData = getProtocolAvailableTokens(PROTOCOLS.aeternity)[contractId];

    const tokenContract = await Contract.initialize({
      ...aeSdk.getContext(),
      aci: FungibleTokenFullInterfaceACI,
      address: contractId as any,
    });

    const { decodedResult } = await tokenContract.allowance({
      from_account: account?.address,
      for_account: tippingContractAddresses?.value?.tippingV2?.replace('ct_', 'ak_'),
    });

    const allowanceAmount = (decodedResult !== undefined)
      ? new BigNumber(decodedResult)
        .multipliedBy(-1)
        .plus(toShiftedBigNumber(amount, tokenData?.decimals!))
        .toNumber()
      : toShiftedBigNumber(amount, tokenData?.decimals!).toNumber();

    const getContractFunction = (tokenContract.methods as any)[
      decodedResult !== undefined ? 'change_allowance' : 'create_allowance'
    ];

    return getContractFunction(
      tippingContractAddresses.value?.tippingV2?.replace(
        `${Encoding.ContractAddress}_`,
        `${Encoding.AccountAddress}_`,
      ),
      allowanceAmount,
    );
  }

  function getTxAssetSymbol(transaction?: ITransaction): string | undefined {
    const { protocol = PROTOCOLS.aeternity, tx = {} as ITx } = transaction || {};
    const protocolTokens = getProtocolAvailableTokens(protocol);

    return (isAssetCoin(tx.contractId) || !tx.contractId)
      ? ProtocolAdapterFactory.getAdapter(protocol).coinSymbol
      : protocolTokens[tx.contractId]?.symbol;
  }

  /**
   * TODO move this function to utilities and make it not dependant on token list
   */
  function getTxAmountTotal(
    transaction: ITransaction,
    direction: string = TX_DIRECTION.sent,
    isTokenSaleBuy: boolean = false,
  ) {
    const isReceived = direction === TX_DIRECTION.received;
    const { protocol, tx } = transaction || {};

    // This is out of place but since we are treating new protocols as fungible tokens
    // it is better to have it here than in the protocol specific helper file
    if (protocol && protocol !== PROTOCOLS.aeternity) {
      const isNonTokenContract = !getProtocolAvailableTokens(protocol)[tx.contractId]
        || tx.tag === Tag.ContractCreateTx;

      return new BigNumber(tx?.amount || 0)
        .plus(isReceived || (!isAssetCoin(tx.contractId) && !isNonTokenContract) ? 0 : tx?.fee || 0)
        .toNumber();
    }

    const contractCallData = transaction?.tx && categorizeContractCallTxObject(transaction);

    const tokenData = protocol
      && getProtocolAvailableTokens(protocol)[contractCallData?.assetContractId!];

    if (contractCallData && tokenData) {
      return +toShiftedBigNumber(
        contractCallData.amount || 0,
        -(tokenData.decimals || AE_COIN_PRECISION), // TODO possibility of temporary wrong precision
      );
    }

    const claimTipAmount = (tx.function === 'claim') ? tx.log?.[0]?.topics[2] : null;

    const rawAmount = (
      (isTokenSaleBuy && getTokenSaleBuyAmount(tx))
      || tx?.amount
      || (tx?.tx?.tx as any)?.amount
      || tx?.nameFee
      || claimTipAmount
      || 0
    );

    const amount: BigNumberPublic = (typeof rawAmount === 'object')
      ? rawAmount
      : new BigNumber(Number(rawAmount));

    let gasCost = new BigNumber(0);
    if (tx?.gasPrice && tx?.gasUsed) {
      gasCost = new BigNumber(tx.gasPrice).multipliedBy(tx.gasUsed);
    }

    return +aettosToAe(amount
      .plus(isReceived ? 0 : tx?.fee || 0)
      .plus(isReceived ? 0 : tx?.tx?.tx?.fee || 0)
      .plus(isReceived ? 0 : gasCost));
  }

  availableTokensPooling(() => loadAvailableTokens());
  tokenBalancesPooling(() => loadTokenBalances());

  if (!composableInitialized) {
    composableInitialized = true;

    // Refresh balances when new account is added
    watch(accounts, (val, oldVal) => {
      if (val.length !== oldVal.length) {
        loadTokenBalances();

        // this is to check if the new account is the first for specified protocol
        if (val.filter(({ protocol }) => protocol === val.at(-1)?.protocol).length === 1) {
          loadAvailableTokens();
        }
      }
    });

    onNetworkChange(async (network, oldNetwork) => {
      const newMiddlewareUrl = network.protocols[PROTOCOLS.aeternity].middlewareUrl;
      const oldMiddlewareUrl = oldNetwork?.protocols?.[PROTOCOLS.aeternity]?.middlewareUrl;
      if (newMiddlewareUrl !== oldMiddlewareUrl) {
        tokenBalances.value = [];
        defaultTokensAvailable.value = {};
        await loadAvailableTokens();
        await loadTokenBalances();
      }
    });
  }

  return {
    accountsTotalTokenBalance,
    tokenBalances,
    tokensAvailable,
    createOrChangeAllowance,
    getAccountTokenBalance,
    getAccountTokenBalances,
    getProtocolAvailableTokens,
    getTxAssetSymbol,
    getTxAmountTotal,
    loadTokenBalances,
    loadAvailableTokens,
  };
}
