/* eslint-disable no-param-reassign */

import { watch } from 'vue';
import BigNumber from 'bignumber.js';
import { Encoding } from '@aeternity/aepp-sdk';
import { toShiftedBigNumber } from '@/utils';
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
} from '@/types';
import { PROTOCOLS, STORAGE_KEYS, TX_DIRECTION } from '@/constants';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';

import FungibleTokenFullInterfaceACI from '@/protocols/aeternity/aci/FungibleTokenFullInterfaceACI.json';
import { aettosToAe, categorizeContractCallTxObject } from '@/protocols/aeternity/helpers';

import { useAccounts } from './accounts';
import { useAeSdk } from './aeSdk';
import { useTippingContracts } from './tippingContracts';
import { createPollingBasedOnMountedComponents } from './composablesHelpers';
import { useStorageRef } from './storageRef';
import { useNetworks } from './networks';

let composableInitialized = false;

/**
 * List of all fungible tokens available on user's protocols.
 * As this list is quite big (hundreds of items) it requires processing optimizations.
 */
const tokensAvailable = useStorageRef<ProtocolRecord<AssetList>>(
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
  const { onNetworkChange } = useNetworks();
  const { getAeSdk } = useAeSdk();
  const { tippingContractAddresses } = useTippingContracts();
  const {
    accounts,
    protocolsInUse,
    getLastActiveProtocolAccount,
  } = useAccounts();

  function getAccountTokenBalances(address: AccountAddress): ITokenBalance[] {
    return tokenBalances.value.filter((token) => token.address === address) || [];
  }

  function getAccountTokenBalance(
    address: AccountAddress,
    contractId: string,
  ): ITokenBalance | undefined {
    return getAccountTokenBalances(address)
      .find((tokenBalance) => tokenBalance.contractId === contractId);
  }

  async function loadAvailableTokens() {
    const tokensFetchPromises = protocolsInUse.value.map(
      (protocol) => ProtocolAdapterFactory.getAdapter(protocol).fetchAvailableTokens(),
    );
    // for each promise check if it returned null, if so, use cached data
    // because it means that we couldn't fetch new data
    const tokens: IToken[] = (await Promise.all(tokensFetchPromises)).map(
      (protocolTokens, index) => (
        protocolTokens
        || Object.values(tokensAvailable.value[protocolsInUse.value[index]] || {})
      ),
    ).flat();

    tokensAvailable.value = tokens.reduce((accumulator, token) => {
      const { contractId, protocol } = token;
      if (!accumulator[protocol]) {
        accumulator[protocol] = {} as AssetList;
      }
      accumulator[protocol]![contractId] = token;
      return accumulator;
    }, {} as typeof tokensAvailable.value);
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
          .getAdapter(protocol).fetchAccountTokenBalances(address);
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

    const tokenContract = await aeSdk.initializeContract({
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

  function getTxAssetSymbol(transaction?: ITransaction) {
    const { protocol = PROTOCOLS.aeternity } = transaction || {};
    const protocolTokens = getProtocolAvailableTokens(protocol);
    let assetContractId = transaction?.tx?.contractId as AssetContractId;

    // TODO move this logic to the AE adapter or transaction normalizer
    if (protocol === PROTOCOLS.aeternity) {
      const contractCallData = transaction?.tx && categorizeContractCallTxObject(transaction);
      if (contractCallData?.token) {
        assetContractId = contractCallData.token;
      }
    }

    return (
      protocolTokens[assetContractId]?.symbol
      || ProtocolAdapterFactory.getAdapter(protocol).protocolSymbol
    );
  }

  /**
   * TODO move this function to utilities and make it not dependant on token list
   */
  function getTxAmountTotal(
    transaction: ITransaction,
    direction: string = TX_DIRECTION.sent,
  ) {
    const isReceived = direction === TX_DIRECTION.received;
    const { protocol, tx } = transaction || {};

    // This is out of place but since we are treating new protocols as fungible tokens
    // it is better to have it here than in the protocol specific helper file
    if (protocol && protocol !== PROTOCOLS.aeternity) {
      return new BigNumber(tx?.amount || 0)
        .plus(isReceived ? 0 : tx?.fee || 0)
        .toNumber();
    }

    const contractCallData = transaction && tx && categorizeContractCallTxObject(transaction);

    const tokenData = protocol && getProtocolAvailableTokens(protocol)[contractCallData?.token!];
    if (contractCallData && tokenData) {
      return +toShiftedBigNumber(
        contractCallData.amount || 0,
        -tokenData.decimals!,
      );
    }

    const claimTipAmount = (tx.function === 'claim') ? tx.log?.[0]?.topics[2] : null;

    const rawAmount = (
      tx?.amount
      || (tx?.tx?.tx as any)?.amount
      || tx?.nameFee
      || claimTipAmount
      || 0
    );

    const amount: BigNumberPublic = (typeof rawAmount === 'object')
      ? rawAmount
      : new BigNumber(Number(rawAmount));

    return +aettosToAe(amount
      .plus(isReceived ? 0 : tx?.fee || 0)
      .plus(isReceived ? 0 : tx?.tx?.tx?.fee || 0));
  }

  availableTokensPooling(() => loadAvailableTokens());
  tokenBalancesPooling(() => loadTokenBalances());

  if (!composableInitialized) {
    composableInitialized = true;

    // Refresh balances when new account is added
    watch(accounts, (val, oldVal) => {
      if (val.length !== oldVal.length) {
        loadTokenBalances();
      }
    });

    onNetworkChange(async (network, oldNetwork) => {
      const newMiddlewareUrl = network.protocols[PROTOCOLS.aeternity].middlewareUrl;
      const oldMiddlewareUrl = oldNetwork?.protocols?.[PROTOCOLS.aeternity]?.middlewareUrl;
      if (newMiddlewareUrl !== oldMiddlewareUrl) {
        await loadAvailableTokens();
        await loadTokenBalances();
      }
    });
  }

  return {
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
