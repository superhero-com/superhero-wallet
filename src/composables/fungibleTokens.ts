import { watch } from 'vue';
import camelCaseKeysDeep from 'camelcase-keys-deep';
import BigNumber from 'bignumber.js';
import { Contract, Encoded, Encoding } from '@aeternity/aepp-sdk';
import { fetchAllPages, handleUnknownError, toShiftedBigNumber } from '@/utils';
import type {
  BigNumberPublic,
  IToken,
  ITokenBalanceResponse,
  ITokenList,
  ITransaction,
  TokenPair,
} from '@/types';
import { PROTOCOL_AETERNITY, STORAGE_KEYS, TX_DIRECTION } from '@/constants';
import FungibleTokenFullInterfaceACI from '@/lib/contracts/FungibleTokenFullInterfaceACI.json';
import AedexV2PairACI from '@/lib/contracts/AedexV2PairACI.json';
import ZeitTokenACI from '@/lib/contracts/FungibleTokenFullACI.json';

import { aettosToAe, calculateSupplyAmount, categorizeContractCallTxObject } from '@/protocols/aeternity/helpers';
import { AE_SYMBOL } from '@/protocols/aeternity/config';
import { useAeMiddleware } from '@/protocols/aeternity/composables';

import { useAccounts } from './accounts';
import { useAeSdk } from './aeSdk';
import { useTippingContracts } from './tippingContracts';
import { createPollingBasedOnMountedComponents } from './composablesHelpers';
import { useStorageRef } from './storageRef';
import { useNetworks } from './networks';

type ContractInitializeOptions = Omit<Parameters<typeof Contract.initialize>[0], 'onNode'>;

let initialized = false;

/**
 * List of all custom tokens available (currently only AE network).
 * As this list is quite big (hundreds of items) it requires processing optimizations.
 */
const availableTokens = useStorageRef<ITokenList>(
  {},
  STORAGE_KEYS.fungibleTokenList,
);

/**
 * List of tokens (assets) owned by active account with the balance value
 */
const tokenBalances = useStorageRef<Record<string, IToken[]>>(
  {},
  STORAGE_KEYS.fungibleTokenBalances,
);

const availableTokensPooling = createPollingBasedOnMountedComponents(60000);
const tokenBalancesPooling = createPollingBasedOnMountedComponents(10000);

export function useFungibleTokens() {
  const { onNetworkChange } = useNetworks();
  const { getAeSdk } = useAeSdk();
  const { fetchFromMiddleware } = useAeMiddleware();
  const { tippingContractAddresses } = useTippingContracts();
  const {
    isLoggedIn,
    aeAccounts,
    getLastActiveProtocolAccount,
  } = useAccounts();

  function getAccountTokenBalances(address?: string): IToken[] {
    const account = getLastActiveProtocolAccount(PROTOCOL_AETERNITY);
    return tokenBalances.value[address || account?.address!] || [];
  }

  async function loadAvailableTokens() {
    const response: IToken[] = camelCaseKeysDeep(await fetchAllPages(
      () => fetchFromMiddleware('/v2/aex9?by=name&limit=100&direction=forward'),
      fetchFromMiddleware,
    ));

    if (!response.length) {
      availableTokens.value = {};
    }

    availableTokens.value = response.reduce((accumulator, token) => {
      // eslint-disable-next-line no-param-reassign
      accumulator[token.contractId] = token;
      return accumulator;
    }, {} as ITokenList);
  }

  async function loadTokenBalances() {
    if (!isLoggedIn.value) {
      return;
    }
    const addresses = aeAccounts.value.map((account) => account.address);

    await Promise.all(addresses.map(async (address) => {
      try {
        const tokens: ITokenBalanceResponse[] = camelCaseKeysDeep(await fetchAllPages(
          () => fetchFromMiddleware(`/v2/aex9/account-balances/${address}?limit=100`),
          fetchFromMiddleware,
        ));
        if (!tokens.length) {
          return;
        }

        tokenBalances.value[address] = tokens
          .filter(({ contractId }) => availableTokens.value[contractId])
          .map(({ amount, contractId }): IToken => {
            const availableToken = availableTokens.value[contractId];
            const balance = toShiftedBigNumber(amount!, -availableToken.decimals);
            const convertedBalance = Number(balance.toFixed(2));

            return {
              ...availableToken, // TODO store the balance and amount separately from asset data
              amount,
              convertedBalance,
            };
          });
      } catch (error) {
        handleUnknownError(error);
      }
    }));
  }

  async function createOrChangeAllowance(contractId: string, amount: number | string) {
    const aeSdk = await getAeSdk();
    const account = getLastActiveProtocolAccount(PROTOCOL_AETERNITY);
    const selectedToken = tokenBalances.value?.[account?.address!]
      ?.find((token) => token?.contractId === contractId);

    const tokenContract = await aeSdk.initializeContract({
      aci: FungibleTokenFullInterfaceACI,
      address: selectedToken?.contractId as any,
    });

    const { decodedResult } = await tokenContract.allowance({
      from_account: account?.address,
      for_account: tippingContractAddresses?.value?.tippingV2?.replace('ct_', 'ak_'),
    });

    const allowanceAmount = (decodedResult !== undefined)
      ? new BigNumber(decodedResult)
        .multipliedBy(-1)
        .plus(toShiftedBigNumber(amount, selectedToken?.decimals!))
        .toNumber()
      : toShiftedBigNumber(amount, selectedToken?.decimals!)
        .toNumber();

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
      const account = getLastActiveProtocolAccount(PROTOCOL_AETERNITY);
      const tokenContract = await aeSdk.initializeContract({
        aci: AedexV2PairACI,
        address,
      });

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
        token0: {
          ...availableTokens.value?.[token0],
          amount: calculateSupplyAmount(
            balance,
            totalSupply,
            reserves.reserve0,
          ),
        },
        token1: {
          ...availableTokens.value?.[token1],
          amount: calculateSupplyAmount(
            balance,
            totalSupply,
            reserves.reserve1,
          ),
        },
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

  function getTxSymbol(transaction?: ITransaction) {
    const contractCallData = transaction?.tx && categorizeContractCallTxObject(transaction);
    const assetContractId = (contractCallData)
      ? contractCallData.token
      : transaction?.tx?.contractId;
    return availableTokens.value[assetContractId!]?.symbol || AE_SYMBOL;
  }

  function getTxAmountTotal(
    transaction: ITransaction,
    direction: string = TX_DIRECTION.sent,
  ) {
    const contractCallData = transaction.tx && categorizeContractCallTxObject(transaction);
    if (contractCallData && availableTokens.value[contractCallData.token!]) {
      return +toShiftedBigNumber(
        contractCallData.amount || 0,
        -availableTokens.value[contractCallData.token!].decimals,
      );
    }
    const isReceived = direction === TX_DIRECTION.received;

    const rawAmount = (
      transaction.tx?.amount
      || (transaction.tx?.tx?.tx as any)?.amount
      || transaction.tx?.nameFee
      || 0
    );

    const amount: BigNumberPublic = (typeof rawAmount === 'object')
      ? rawAmount
      : new BigNumber(Number(rawAmount));

    return +aettosToAe(amount
      .plus(isReceived ? 0 : transaction.tx?.fee || 0)
      .plus(isReceived ? 0 : transaction.tx?.tx?.tx?.fee || 0));
  }

  watch(aeAccounts, (val, oldVal) => {
    if (val !== oldVal) {
      loadTokenBalances();
    }
  });

  availableTokensPooling(() => loadAvailableTokens());
  tokenBalancesPooling(() => loadTokenBalances());

  if (!initialized) {
    initialized = true;

    onNetworkChange(async (network, oldNetwork) => {
      const newMiddlewareUrl = network.protocols[PROTOCOL_AETERNITY].middlewareUrl;
      const oldMiddlewareUrl = oldNetwork?.protocols?.[PROTOCOL_AETERNITY]?.middlewareUrl;
      if (newMiddlewareUrl !== oldMiddlewareUrl) {
        await loadAvailableTokens();
        await loadTokenBalances();
      }
    });
  }

  return {
    availableTokens,
    tokenBalances,
    burnTriggerPoS,
    createOrChangeAllowance,
    getAccountTokenBalances,
    getContractTokenPairs,
    getTxSymbol,
    getTxAmountTotal,
    transferToken,
    loadTokenBalances,
    loadAvailableTokens,
  };
}
