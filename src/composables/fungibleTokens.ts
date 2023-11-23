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
import { PROTOCOLS, STORAGE_KEYS, TX_DIRECTION } from '@/constants';
import FungibleTokenFullInterfaceACI from '@/lib/contracts/FungibleTokenFullInterfaceACI.json';
import AedexV2PairACI from '@/lib/contracts/AedexV2PairACI.json';
import ZeitTokenACI from '@/lib/contracts/FungibleTokenFullACI.json';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';

import { aettosToAe, calculateSupplyAmount, categorizeContractCallTxObject } from '@/protocols/aeternity/helpers';
import { AE_SYMBOL } from '@/protocols/aeternity/config';

import { useAccounts } from './accounts';
import { useAeSdk } from './aeSdk';
import { useMiddleware } from './middleware';
import { useTippingContracts } from './tippingContracts';
import { createNetworkWatcher } from './networks';
import { createPollingBasedOnMountedComponents } from './composablesHelpers';
import { useStorageRef } from './storageRef';

type ContractInitializeOptions = Omit<Parameters<typeof Contract.initialize>[0], 'onNode'>;

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

const { onNetworkChange } = createNetworkWatcher();
const availableTokensPooling = createPollingBasedOnMountedComponents(60000);
const tokenBalancesPooling = createPollingBasedOnMountedComponents(10000);

export function useFungibleTokens() {
  const { getAeSdk } = useAeSdk();
  const { fetchFromMiddleware } = useMiddleware();
  const { tippingContractAddresses } = useTippingContracts();
  const {
    isLoggedIn,
    aeAccounts,
    protocolsInUse,
    getLastActiveProtocolAccount,
  } = useAccounts();

  function getAccountTokenBalances(address?: string): IToken[] {
    const account = getLastActiveProtocolAccount(PROTOCOLS.aeternity);
    return tokenBalances.value[address || account?.address!] || [];
  }

  async function loadAvailableTokens() {
    const tokensFetchPromises = protocolsInUse.value.map(
      (protocol) => ProtocolAdapterFactory.getAdapter(protocol).fetchAvailableTokens(),
    );
    const tokens: IToken[] = (await Promise.all(tokensFetchPromises)).flat();

    if (!tokens.length) {
      availableTokens.value = {};
    }

    availableTokens.value = tokens.reduce((accumulator, token) => {
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
    const account = getLastActiveProtocolAccount(PROTOCOLS.aeternity);
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
      const account = getLastActiveProtocolAccount(PROTOCOLS.aeternity);
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
    if (transaction?.pendingTokenTx) {
      return availableTokens.value[transaction.tx.contractId]?.symbol;
    }
    const contractCallData = transaction?.tx && categorizeContractCallTxObject(transaction);
    return availableTokens.value[contractCallData?.token!]?.symbol || AE_SYMBOL;
  }

  function getTxAmountTotal(
    transaction: ITransaction,
    direction: string = TX_DIRECTION.sent,
  ) {
    const isReceived = direction === TX_DIRECTION.received;

    // This is out of place but since we are treating new protocols as fungible tokens
    // it is better to have it here than in the protocol specific helper file
    if (transaction.protocol && transaction.protocol !== PROTOCOLS.aeternity) {
      return new BigNumber(
        transaction.tx?.amount || 0,
      )
        .plus(isReceived ? 0 : transaction.tx?.fee || 0)
        .toNumber();
    }

    const contractCallData = transaction.tx && categorizeContractCallTxObject(transaction);
    if (contractCallData && availableTokens.value[contractCallData.token!]) {
      return +toShiftedBigNumber(
        contractCallData.amount || 0,
        -availableTokens.value[contractCallData.token!].decimals,
      );
    }

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

  onNetworkChange(async (network, oldNetwork) => {
    const newMiddlewareUrl = network.protocols[PROTOCOLS.aeternity].middlewareUrl;
    const oldMiddlewareUrl = oldNetwork?.protocols?.[PROTOCOLS.aeternity]?.middlewareUrl;
    if (newMiddlewareUrl !== oldMiddlewareUrl) {
      await loadAvailableTokens();
      await loadTokenBalances();
    }
  });

  watch(aeAccounts, (val, oldVal) => {
    if (val !== oldVal) {
      loadTokenBalances();
    }
  });

  availableTokensPooling(() => loadAvailableTokens());
  tokenBalancesPooling(() => loadTokenBalances());

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
