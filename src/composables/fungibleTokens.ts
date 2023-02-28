import camelcaseKeysDeep from 'camelcase-keys-deep';
import { SCHEMA } from '@aeternity/aepp-sdk';
import FUNGIBLE_TOKEN_CONTRACT from 'aeternity-fungible-token/FungibleTokenFullInterface.aes';
import BigNumber from 'bignumber.js';
import pairInterface from 'dex-contracts-v2/build/IAedexV2Pair.aes';
import {
  computed,
  ref,
  watch,
} from '@vue/composition-api';
import { isEmpty, uniqBy } from 'lodash-es';
import {
  AETERNITY_CONTRACT_ID,
  AETERNITY_DECIMALS,
  AETERNITY_NAME,
  AETERNITY_SYMBOL,
  aettosToAe,
  calculateSupplyAmount,
  categorizeContractCallTxObject,
  convertToken,
  CURRENCY_URL,
  fetchJson,
  handleUnknownError,
  TX_FUNCTIONS,
  watchUntilTruthy,
  ZEIT_TOKEN_INTERFACE,
} from '../popup/utils';
import type {
  IDefaultComposableOptions,
  IDexContracts,
  IDexTokenPairs,
  INetwork,
  IPendingTransaction,
  IRawTokenTransaction,
  IToken,
  ITransaction,
  IAsset,
  IAex9Balance,
  ITokenBalance,
  Balance,
  ITx,
  TxFunctionRaw,
} from '../types';
import { createPollingBasedOnMountedComponents } from './composablesHelpers';
import { useSdk } from './sdk';
import { useBalances } from './balances';
import { useMultisigBalances } from './multisigBalances';

const availableTokens = ref<Record<string, IToken>>({});
const tokens = ref<Record<string, {tokenBalances: ITokenBalance[]}>>({});
const aePublicData = ref<IAsset>({} as IAsset);
const transactions = ref<Record<string, {transactions: ITransaction[]}>>({});

const initPollingWatcher = createPollingBasedOnMountedComponents();

export interface ITransferTokensOptions {
  contractId: string
  recipient: string
  amount: number
  options: {
    waitMined: boolean,
    modal: boolean
  }
}

export interface IBurnTriggerPosOptions {
  contractId: string
  amount: number
  posAddress: string
  invoiceId: string
  options: {
    waitMined: boolean,
    modal: boolean
  }
}

export interface IFungibleTokensOptions extends IDefaultComposableOptions {
  accountAddress?: string
}

export function useFungibleTokens({ store, accountAddress }: IFungibleTokensOptions) {
  const activeNetwork = computed<INetwork>(() => store.getters.activeNetwork);
  const getDexContracts = computed<IDexContracts>(() => store.getters.getDexContracts);
  const middleware = computed(() => store.state.middleware);
  const activeCurrency = computed(() => store.state.current.currency);
  const currentCurrencyRate = computed(() => store.getters.currentCurrencyRate);
  const { getSdk } = useSdk({ store });
  const { balances } = useBalances({ store });
  const { multisigBalances } = useMultisigBalances({ store });

  const tokenBalances = computed((): IToken[] => (
    accountAddress ? tokens.value?.[accountAddress]?.tokenBalances || [] : []
  ));

  function resetTokensAndTransactions() {
    tokens.value = {};
    transactions.value = {};
  }

  const aeternityTokenBalance = computed((): Balance => (
    accountAddress
      ? balances.value[accountAddress] || multisigBalances.value[accountAddress] || new BigNumber(0)
      : new BigNumber(0)
  ));

  const aeternityTokenBalanceCurrency = computed((): number => (
    aeternityTokenBalance.value.toNumber() * currentCurrencyRate.value
  ));

  /**
   * Returns an object representing the Aeternity token,
   * with the specified balance and balance currency.
   */
  const aeternityToken = computed((): IToken => ({
    contractId: AETERNITY_CONTRACT_ID,
    convertedBalance: aeternityTokenBalance.value,
    balanceCurrency: aeternityTokenBalanceCurrency.value,
    symbol: AETERNITY_SYMBOL,
    decimals: aePublicData.value?.decimals || AETERNITY_DECIMALS,
    name: aePublicData.value?.name || AETERNITY_NAME,
  }));

  const aeternityAsset = computed((): IAsset => ({
    ...aePublicData.value,
    symbol: AETERNITY_SYMBOL,
    convertedBalance: aeternityTokenBalance.value,
    balanceCurrency: aeternityTokenBalanceCurrency.value,
    contractId: AETERNITY_CONTRACT_ID,
  }));

  /**
   * Loads available tokens from current active network.
   */
  async function loadAvailableTokens(): Promise<void> {
    try {
      await watchUntilTruthy(() => middleware.value);
      const response: IToken[] = camelcaseKeysDeep(await fetchJson(
        `${activeNetwork.value.middlewareUrl}/aex9/by_name`,
      ));

      if (isEmpty(response) || typeof response !== 'object') {
        availableTokens.value = {};
      } else {
        const fetchedTokens: Record<string, IToken> = response.reduce(
          (obj, token: IToken) => ({
            ...obj, [token.contractId]: token,
          }), {},
        );

        availableTokens.value = fetchedTokens;
      }
    } catch (error) {
      handleUnknownError(error);
    }
  }

  /**
   * Loads the address token balances.
   */
  async function loadTokenBalances() {
    if (!accountAddress) {
      return;
    }
    try {
      await watchUntilTruthy(() => middleware.value);
      if (isEmpty(availableTokens.value)) {
        await loadAvailableTokens();
      }

      // TODO: switch to mdw v2 route, once sync issue is resolved
      // const _tokens = await getAllPages(
      //   () => fetchJson(
      //     `${activeNetwork.value.middlewareUrl}/v2/aex9/account-balances/${address}?limit=100`,
      //   ),
      //   middleware.value.fetchByPath,
      // );

      const _tokens: IAex9Balance[] = camelcaseKeysDeep(await fetchJson(
        `${activeNetwork.value.middlewareUrl}/aex9/balances/account/${accountAddress}`,
      ));

      if (isEmpty(_tokens) || typeof _tokens !== 'object') {
        return;
      }

      const _balances: ITokenBalance[] = _tokens
        .filter(({ contractId }) => !!availableTokens.value[contractId])
        .map(({ amount, contractId }): ITokenBalance => {
          const token: IToken = availableTokens.value[contractId];
          const tokenBalance = convertToken(amount, -token.decimals);
          const convertedBalance = tokenBalance.toFixed(2);
          return {
            ...token,
            value: contractId,
            text: `${convertedBalance} ${token.symbol}`,
            contractId,
            balance: tokenBalance,
            convertedBalance,
          };
        });

      const newTokens = { ...tokens.value };

      if (!(accountAddress in newTokens)) {
        newTokens[accountAddress] = {
          tokenBalances: _balances,
        };
      } else {
        newTokens[accountAddress].tokenBalances = _balances;
      }

      tokens.value = { ...newTokens };
    } catch (e) {
      handleUnknownError(e);
    }
  }

  async function loadAeternityData() {
    try {
      const [aeternityData] = await fetchJson(
        `${CURRENCY_URL}${activeCurrency.value}`,
      );
      aePublicData.value = aeternityData;
    } catch (error) {
      handleUnknownError(error);
    }
  }

  async function createOrChangeAllowance([contractId, amount]: any) {
    if (!accountAddress) {
      return;
    }
    const sdk = await getSdk();

    const selectedToken = tokens.value?.[accountAddress]?.tokenBalances
      ?.find((t: IToken) => t?.contractId === contractId);

    if (!selectedToken) {
      return;
    }

    const tokenContract = await sdk.getContractInstance({
      source: FUNGIBLE_TOKEN_CONTRACT,
      contractAddress: selectedToken.contractId,
    });
    const { decodedResult } = await tokenContract.methods.allowance({
      from_account: accountAddress,
      for_account: activeNetwork.value.tipContractV2?.replace('ct_', 'ak_'),
    });
    const allowanceAmount = decodedResult !== undefined
      ? new BigNumber(decodedResult)
        .multipliedBy(-1)
        .plus(convertToken(amount, selectedToken.decimals))
        .toNumber()
      : convertToken(amount, selectedToken.decimals).toFixed();

    await tokenContract.methods[
      decodedResult !== undefined ? 'change_allowance' : 'create_allowance'
    ](activeNetwork.value.tipContractV2?.replace('ct_', 'ak_'), allowanceAmount);
  }

  async function fetchContractTokenPairs(contractAddress: string): Promise<IDexTokenPairs | null> {
    const sdk = await getSdk();
    try {
      const tokenContract = await sdk.getContractInstance({
        source: pairInterface,
        contractAddress,
      });

      const [
        { decodedResult: _balances },
        { decodedResult: _balance },
        { decodedResult: token0 },
        { decodedResult: token1 },
        { decodedResult: reserves },
        { decodedResult: totalSupply },
      ] = await Promise.all([
        tokenContract.methods.balances(),
        tokenContract.methods.balance(accountAddress),
        tokenContract.methods.token0(),
        tokenContract.methods.token1(),
        tokenContract.methods.get_reserves(),
        tokenContract.methods.total_supply(),
      ]);

      return {
        token0: {
          ...availableTokens.value?.[token0],
          amount: calculateSupplyAmount(
            _balance, totalSupply, reserves.reserve0,
          ) as number,
          reserve: reserves.reserve0,
        },
        token1: {
          ...availableTokens.value?.[token1],
          amount: calculateSupplyAmount(
            _balance, totalSupply, reserves.reserve1,
          ) as number,
          reserve: reserves.reserve1,
        },
        totalSupply,
        balance: _balance,
        balances: _balances,
      };
    } catch (error) {
      handleUnknownError(error);
      return null;
    }
  }

  async function transferTokens({
    contractId,
    recipient,
    amount,
    options,
  }: ITransferTokensOptions) {
    const sdk = await getSdk();
    const tokenContract = await sdk.getContractInstance({
      source: FUNGIBLE_TOKEN_CONTRACT,
      contractAddress: contractId,
    });
    return tokenContract.methods.transfer(recipient, amount.toFixed(), options);
  }

  async function burnTriggerPoS({
    contractId,
    amount,
    posAddress,
    invoiceId,
    options,
  }: IBurnTriggerPosOptions) {
    const sdk = await getSdk();
    const tokenContract = await sdk.getContractInstance({
      source: ZEIT_TOKEN_INTERFACE,
      contractAddress: contractId,
    });
    return tokenContract.methods.burn_trigger_pos(
      amount.toFixed(), posAddress, invoiceId, options,
    );
  }

  async function fetchTokensHistory(address: string, recent = false): Promise<ITransaction[]> {
    const addressTransactions = transactions.value[address]?.transactions || [];

    if (addressTransactions?.length && !recent) {
      return addressTransactions;
    }

    let rawTransactions: IRawTokenTransaction[] = [];
    const lastTransaction = addressTransactions?.[0];

    if (recent) {
      let nextPageUrl = null;
      let isAllNewTransactionsLoaded = false;

      await watchUntilTruthy(() => middleware.value);

      while (!isAllNewTransactionsLoaded && nextPageUrl !== null) {
        const url = nextPageUrl
          ? `${activeNetwork.value.middlewareUrl}/${nextPageUrl}`
          : `${activeNetwork.value.middlewareUrl}/v2/aex9/transfers/to/${address}`;
        // eslint-disable-next-line no-await-in-loop
        const { data, next }: any = await fetchJson(url);

        if (!data?.length) {
          break;
        }

        rawTransactions.push(...camelcaseKeysDeep(data));

        if (
          data.some((t: any) => t?.tx_hash === lastTransaction?.hash)
          || !addressTransactions?.length
        ) {
          isAllNewTransactionsLoaded = true;
        }

        nextPageUrl = next;
      }

      if (rawTransactions?.[0]?.txHash === lastTransaction?.hash) {
        return addressTransactions.slice(0, 10);
      }
    } else {
      const data = await fetchJson(`${activeNetwork.value.middlewareUrl}/aex9/transfers/to/${address}`);
      rawTransactions = camelcaseKeysDeep(data);
    }

    const newTransactions: ITransaction[] = rawTransactions
      .filter((tx) => !getDexContracts.value.router.includes(tx.contractId))
      .map((tx: IRawTokenTransaction) => ({
        ...tx,
        tx: {
          senderId: tx.sender,
          recipientId: tx.recipient,
          callerId: tx.sender,
          type: SCHEMA.TX_TYPE.contractCall,
          ...tx,
        } as any,
        incomplete: true,
        pending: false,
        claim: false,
        hash: tx.txHash,
      }));

    const newLocalTransactions = { ...transactions.value };
    const addressData = newLocalTransactions[address] || { transactions: [] };

    if (newTransactions?.[0]?.hash !== lastTransaction?.hash && recent) {
      addressData.transactions = uniqBy([...newTransactions, ...addressData.transactions], 'hash');
    } else {
      addressData.transactions = newTransactions.reverse();
    }

    newLocalTransactions[address] = addressData;

    transactions.value = { ...newLocalTransactions };

    return addressData.transactions;
  }

  function getTxSymbol(transaction: Partial<ITransaction> | IPendingTransaction): string {
    if ((transaction as IPendingTransaction).pendingTokenTx) {
      return availableTokens.value[(transaction as ITransaction).tx?.contractId]?.symbol;
    }
    const contractCallData = (
      transaction.tx && categorizeContractCallTxObject(transaction as ITransaction)
    );

    if (!contractCallData?.token) {
      return AETERNITY_SYMBOL;
    }

    return availableTokens.value[contractCallData?.token]?.symbol || AETERNITY_SYMBOL;
  }

  function getTxAmountTotal(
    transaction: Partial<ITransaction>,
    direction: TxFunctionRaw = TX_FUNCTIONS.sent,
  ) {
    const contractCallData = (
      transaction.tx && categorizeContractCallTxObject(transaction as ITransaction)
    );
    if (contractCallData?.token && availableTokens.value[contractCallData.token]) {
      return +convertToken(
        contractCallData.amount as number,
        -availableTokens.value[contractCallData.token].decimals,
      );
    }

    const isSent = direction === TX_FUNCTIONS.sent;

    return +aettosToAe(
      new BigNumber(
        transaction.tx?.amount
        || (transaction.tx?.tx?.tx as ITx)?.amount
        || transaction.tx?.nameFee || 0,
      )
        .plus(isSent ? transaction.tx?.fee || 0 : 0)
        .plus(isSent ? transaction.tx?.tx?.tx?.fee || 0 : 0)
        .toString(),
    );
  }

  watch(
    activeNetwork,
    async (network, oldNetwork) => {
      if (
        (!oldNetwork && Object.keys(availableTokens.value).length)
        || (network?.middlewareUrl === oldNetwork?.middlewareUrl)
      ) {
        return;
      }

      resetTokensAndTransactions();
      await loadAvailableTokens();
      loadTokenBalances();
    },
    { immediate: true },
  );

  initPollingWatcher(() => loadAvailableTokens(), 60000);
  initPollingWatcher(() => loadTokenBalances(), 10000);

  return {
    tokens,
    aePublicData,
    transactions,
    aeternityTokenBalance,
    aeternityTokenBalanceCurrency,
    aeternityToken,
    aeternityAsset,
    availableTokens,
    tokenBalances,
    loadAeternityData,
    loadTokenBalances,
    resetTokensAndTransactions,
    createOrChangeAllowance,
    fetchContractTokenPairs,
    transferTokens,
    burnTriggerPoS,
    fetchTokensHistory,
    getTxSymbol,
    getTxAmountTotal,
  };
}
