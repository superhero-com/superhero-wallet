import { ref, watch } from 'vue';
import { useStore } from 'vuex';
import camelCaseKeysDeep from 'camelcase-keys-deep';
import BigNumber from 'bignumber.js';
import { Encoded } from '@aeternity/aepp-sdk';
import { fetchAllPages, handleUnknownError, toShiftedBigNumber } from '@/utils';
import {
  BigNumberPublic,
  IToken,
  ITokenList,
  ITransaction,
} from '@/types';
import { PROTOCOL_AETERNITY, TX_DIRECTION } from '@/constants';
import { aettosToAe, calculateSupplyAmount, categorizeContractCallTxObject } from '@/protocols/aeternity/helpers';
import FungibleTokenFullInterfaceACI from '@/lib/contracts/FungibleTokenFullInterfaceACI.json';
import AedexV2PairACI from '@/lib/contracts/AedexV2PairACI.json';
import ZeitTokenACI from '@/lib/contracts/FungibleTokenFullACI.json';
import { AE_SYMBOL } from '@/protocols/aeternity/config';
import { useAccounts } from './accounts';
import { useAeSdk } from './aeSdk';
import { useMiddleware } from './middleware';
import { useTippingContracts } from './tippingContracts';
import { useNetworks } from './networks';

const availableTokens = ref<ITokenList>({});
const tokensBalance = ref<Record<string, IToken[]>>({});

export function useFungibleTokens() {
  const store = useStore();
  const { activeNetwork } = useNetworks();
  const { getAeSdk } = useAeSdk({ store });
  const { fetchFromMiddleware } = useMiddleware();
  const { tippingContractAddresses } = useTippingContracts({ store });
  const {
    isLoggedIn,
    accounts,
    aeNextAccountIdx,
    getLastActiveProtocolAccount,
  } = useAccounts({ store });

  function getTokenBalance(address?: string) {
    const account = getLastActiveProtocolAccount(PROTOCOL_AETERNITY);
    return tokensBalance.value[address || account?.address!] || [];
  }

  async function loadAvailableTokens() {
    const response: IToken[] = camelCaseKeysDeep(await fetchAllPages(
      () => fetchFromMiddleware('/v2/aex9?by=name&limit=100&direction=forward') as any,
      fetchFromMiddleware as any,
    ));

    if (!response.length) {
      availableTokens.value = {};
    }

    availableTokens.value = response.reduce((accumulator, token) => {
      const { contractId, ...other } = token;

      return {
        ...accumulator,
        [contractId]: { contractId, ...other },
      };
    }, {});
  }

  async function loadTokenBalances() {
    if (!isLoggedIn.value) {
      return;
    }
    const addresses = (accounts.value)
      .filter((account) => account.protocol === PROTOCOL_AETERNITY)
      .map((account) => account.address);

    await Promise.all(addresses.map(async (address) => {
      try {
        const tokens: IToken[] = camelCaseKeysDeep(await fetchAllPages(
          () => fetchFromMiddleware(`/v2/aex9/account-balances/${address}?limit=100`) as any,
          fetchFromMiddleware as any,
        ));
        if (!tokens.length) {
          return;
        }

        const balances = (tokens)
          .filter((token) => availableTokens.value[token.contractId])
          .map((token) => {
            const availableToken = availableTokens.value[token.contractId];
            const balance = toShiftedBigNumber(token.amount!, -availableToken.decimals);
            const convertedBalance = Number(balance.toFixed(2));

            return {
              ...availableToken,
              value: token.contractId,
              text: `${convertedBalance} ${availableToken.symbol}`,
              contractId: token.contractId,
              balance,
              convertedBalance,
            } as IToken;
          });

        tokensBalance.value[address] = balances;
      } catch (error) {
        handleUnknownError(error);
      }
    }));
  }

  async function createOrChangeAllowance(contractId: string, amount: number | string) {
    const aeSdk = await getAeSdk();
    const account = getLastActiveProtocolAccount(PROTOCOL_AETERNITY);
    const selectedToken = tokensBalance.value?.[account?.address!]
      ?.find((token) => token?.contractId === contractId);

    const tokenContract = await aeSdk.initializeContract({
      aci: FungibleTokenFullInterfaceACI,
      address: selectedToken?.contractId as any,
    });

    const { decodedResult } = await tokenContract.allowance({
      from_account: account?.address,
      for_account: tippingContractAddresses?.value?.tippingV2?.replace('ct_', 'ak_'),
    });

    const allowanceAmount = decodedResult !== undefined
      ? new BigNumber(decodedResult)
        .multipliedBy(-1)
        .plus(toShiftedBigNumber(amount, selectedToken?.decimals!))
        .toNumber()
      : toShiftedBigNumber(amount, selectedToken?.decimals!).toFixed();

    const getContractFunction = (tokenContract.methods as any)[
      decodedResult !== undefined ? 'change_allowance' : 'create_allowance'
    ];

    return getContractFunction(
      tippingContractAddresses.value?.tippingV2?.replace('ct_', 'ak_'),
      allowanceAmount,
    );
  }

  async function getContractTokenPairs(
    address: Encoded.ContractAddress,
  ): Promise<Record<string, IToken>> {
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

  async function transfer(
    address: string,
    toAccount: any,
    amount: any,
    option: any,
  ) {
    const aeSdk = await getAeSdk();
    const tokenContract = await aeSdk.initializeContract({
      aci: FungibleTokenFullInterfaceACI,
      address: address as any,
    });
    return tokenContract.transfer(toAccount, amount.toFixed(), option);
  }

  async function burnTriggerPoS(
    address: string,
    posAddress: any,
    invoiceId: any,
    amount: any,
    option: any,
  ) {
    const aeSdk = await getAeSdk();
    const tokenContract = await aeSdk.initializeContract({
      aci: ZeitTokenACI,
      address: address as any,
    });
    return tokenContract.burn_trigger_pos(
      amount.toFixed(), posAddress, invoiceId, option,
    );
  }

  watch(activeNetwork, async (network, oldNetwork) => {
    const newMiddlewareUrl = network.protocols[PROTOCOL_AETERNITY].middlewareUrl;
    const oldMiddlewareUrl = oldNetwork?.protocols?.[PROTOCOL_AETERNITY]?.middlewareUrl;
    if (newMiddlewareUrl === oldMiddlewareUrl) {
      return;
    }
    await loadAvailableTokens();
    await loadTokenBalances();
  }, { immediate: true });

  watch(aeNextAccountIdx, async (val, oldVal) => {
    if (val !== oldVal) {
      await loadTokenBalances();
    }
  });

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
    const contractCallData = transaction.tx && categorizeContractCallTxObject(transaction);
    if (contractCallData && availableTokens.value[contractCallData.token!]) {
      return +toShiftedBigNumber(
        contractCallData.amount || 0,
        -availableTokens.value[contractCallData.token!].decimals,
      );
    }
    const isReceived = direction === TX_DIRECTION.received;

    const rawAmount = transaction.tx?.amount
            || (transaction.tx?.tx?.tx as any)?.amount
            || transaction.tx?.nameFee || 0;

    const amount: BigNumberPublic = (typeof rawAmount === 'object')
      ? rawAmount
      : new BigNumber(Number(rawAmount));

    return +aettosToAe(amount
      .plus(isReceived ? 0 : transaction.tx?.fee || 0)
      .plus(isReceived ? 0 : transaction.tx?.tx?.tx?.fee || 0));
  }

  return {
    availableTokens,
    tokensBalance,
    getTokenBalance,
    createOrChangeAllowance,
    getTxSymbol,
    getTxAmountTotal,
    transfer,
    burnTriggerPoS,
    getContractTokenPairs,
    loadTokenBalances,
    loadAvailableTokens,
  };
}
