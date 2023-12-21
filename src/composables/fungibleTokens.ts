/* eslint-disable no-param-reassign */

import { watch } from 'vue';
import BigNumber from 'bignumber.js';
import { Contract, Encoded, Encoding } from '@aeternity/aepp-sdk';
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
  TokenPair,
  Protocol,
} from '@/types';
import { PROTOCOLS, STORAGE_KEYS, TX_DIRECTION } from '@/constants';
import FungibleTokenFullInterfaceACI from '@/lib/contracts/FungibleTokenFullInterfaceACI.json';
import AedexV2PairACI from '@/lib/contracts/AedexV2PairACI.json';
import ZeitTokenACI from '@/lib/contracts/FungibleTokenFullACI.json';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';

import { aettosToAe, calculateSupplyAmount, categorizeContractCallTxObject } from '@/protocols/aeternity/helpers';
import { AE_SYMBOL } from '@/protocols/aeternity/config';

import { useAccounts } from './accounts';
import { useAeSdk } from './aeSdk';
import { useTippingContracts } from './tippingContracts';
import { createNetworkWatcher } from './networks';
import { createPollingBasedOnMountedComponents } from './composablesHelpers';
import { useStorageRef } from './storageRef';

type ContractInitializeOptions = Omit<Parameters<typeof Contract.initialize>[0], 'onNode'>;

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

const { onNetworkChange } = createNetworkWatcher();
const availableTokensPooling = createPollingBasedOnMountedComponents(60000);
const tokenBalancesPooling = createPollingBasedOnMountedComponents(10000);

let areTokenBalancesUpdating = false;

/**
 * Store and provide the access to all protocol's fungible tokens.
 */
export function useFungibleTokens() {
  const { getAeSdk } = useAeSdk();
  const { tippingContractAddresses } = useTippingContracts();
  const {
    accounts,
    aeAccounts,
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
    const tokens: IToken[] = (await Promise.all(tokensFetchPromises)).flat();

    if (!tokens.length) {
      tokensAvailable.value = {};
    }

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
    const tokenBalancesFetchPromises = accounts.value.map(
      ({ address, protocol }) => ProtocolAdapterFactory.getAdapter(protocol)
        .fetchAccountTokenBalances(address),
    );
    tokenBalances.value = (await Promise.all(tokenBalancesFetchPromises)).flat();
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

  async function getContractTokenPairs(
    address: Encoded.ContractAddress,
  ): Promise<Partial<TokenPair> & Record<string, any>> {
    try {
      const aeSdk = await getAeSdk();
      const account = getLastActiveProtocolAccount(PROTOCOLS.aeternity);
      const tokenContract = await aeSdk.initializeContract({
        aci: AedexV2PairACI,
        address,
      });
      const protocolTokens: AssetList = tokensAvailable.value?.[PROTOCOLS.aeternity]
        || {} as AssetList;

      const [
        { decodedResult: balances },
        { decodedResult: balance },
        { decodedResult: token0 },
        { decodedResult: token1 },
        { decodedResult: reserves },
        { decodedResult: totalSupply },
      ] = await Promise.all([
        tokenContract.balances(),
        tokenContract.balance(account?.address),
        tokenContract.token0(),
        tokenContract.token1(),
        tokenContract.get_reserves(),
        tokenContract.total_supply(),
      ]);

      return {
        token0: (protocolTokens[token0])
          ? {
            ...protocolTokens[token0],
            amount: calculateSupplyAmount(
              balance,
              totalSupply,
              reserves.reserve0,
            )!,
          }
          : undefined,
        token1: (protocolTokens[token1])
          ? {
            ...protocolTokens[token1],
            amount: calculateSupplyAmount(
              balance,
              totalSupply,
              reserves.reserve1,
            )!,
          }
          : undefined,
        totalSupply,
        balance,
        balances,
      };
    } catch (error) {
      return {};
    }
  }

  async function transferToken(
    tokenContractId: Encoded.ContractAddress,
    toAccount: Encoded.AccountAddress,
    amount: number,
    options: ContractInitializeOptions,
  ) {
    const aeSdk = await getAeSdk();
    const tokenContract = await aeSdk.initializeContract({
      aci: FungibleTokenFullInterfaceACI,
      address: tokenContractId,
    });
    return tokenContract.transfer(toAccount, amount.toFixed(), options);
  }

  async function burnTriggerPoS(
    address: Encoded.ContractAddress,
    posAddress: string,
    invoiceId: string,
    amount: number,
    options: ContractInitializeOptions,
  ) {
    const aeSdk = await getAeSdk();
    const tokenContract = await aeSdk.initializeContract({
      aci: ZeitTokenACI,
      address,
    });
    return tokenContract.burn_trigger_pos(
      amount.toFixed(),
      posAddress,
      invoiceId,
      options,
    );
  }

  function getTxAssetSymbol(transaction?: ITransaction) {
    const { protocol = PROTOCOLS.aeternity } = transaction || {};

    if (protocol === PROTOCOLS.aeternity) {
      const protocolTokens = getProtocolAvailableTokens(protocol);
      const contractCallData = transaction?.tx && categorizeContractCallTxObject(transaction);
      const assetContractId = (contractCallData)
        ? contractCallData.token
        : transaction?.tx?.contractId;
      return protocolTokens[assetContractId!]?.symbol || AE_SYMBOL;
    }

    return ProtocolAdapterFactory.getAdapter(protocol).protocolSymbol;
  }

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

    const rawAmount = (
      tx?.amount
      || (tx?.tx?.tx as any)?.amount
      || tx?.nameFee
      || 0
    );

    const amount: BigNumberPublic = (typeof rawAmount === 'object')
      ? rawAmount
      : new BigNumber(Number(rawAmount));

    return +aettosToAe(amount
      .plus(isReceived ? 0 : tx?.fee || 0)
      .plus(isReceived ? 0 : tx?.tx?.tx?.fee || 0));
  }

  onNetworkChange(async (network, oldNetwork) => {
    const newMiddlewareUrl = network.protocols[PROTOCOLS.aeternity].middlewareUrl;
    const oldMiddlewareUrl = oldNetwork?.protocols?.[PROTOCOLS.aeternity]?.middlewareUrl;
    if (newMiddlewareUrl !== oldMiddlewareUrl) {
      await loadAvailableTokens();
      await loadTokenBalances();
    }
  });

  watch(aeAccounts, (val, oldVal) => {
    if (val.length !== oldVal.length) {
      loadTokenBalances();
    }
  });

  availableTokensPooling(() => loadAvailableTokens());
  tokenBalancesPooling(() => loadTokenBalances());

  return {
    tokenBalances,
    tokensAvailable,
    burnTriggerPoS,
    createOrChangeAllowance,
    getAccountTokenBalance,
    getAccountTokenBalances,
    getProtocolAvailableTokens,
    getContractTokenPairs,
    getTxAssetSymbol,
    getTxAmountTotal,
    transferToken,
    loadTokenBalances,
    loadAvailableTokens,
  };
}
