/* eslint-disable prefer-const */
/* eslint-disable class-methods-use-this */
import {
  Contract,
  decode,
  encode,
  Encoded,
  Encoding,
  isAddressValid,
  MemoryAccount,
  AccountMnemonicFactory,
} from '@aeternity/aepp-sdk';
import camelCaseKeysDeep from 'camelcase-keys-deep';
import { cloneDeep, sumBy, uniq } from 'lodash-es';

import type {
  AccountAddress,
  AdapterNetworkSettingList,
  AssetAmount,
  AssetContractId,
  IAccount,
  IAccountRaw,
  IAmountDecimalPlaces,
  ICoin,
  IFetchTransactionResult,
  IHdWalletAccount,
  IPageableResponse,
  IToken,
  ITokenBalance,
  ITokenBalanceResponse,
  ITransaction,
  ITransactionApiPaginationParams,
  ITransferResponse,
  MarketData,
  NetworkTypeDefault,
} from '@/types';
import JsonBig from '@/lib/json-big';
import FungibleTokenFullInterfaceACI from '@/protocols/aeternity/aci/FungibleTokenFullInterfaceACI.json';
import { ACCOUNT_TYPES, PROTOCOLS, TXS_PER_PAGE } from '@/constants';
import { useAeSdk } from '@/composables/aeSdk';
import { BaseProtocolAdapter } from '@/protocols/BaseProtocolAdapter';
import { tg } from '@/popup/plugins/i18n';
import {
  amountRounded,
  fetchAllPages,
  fetchJson,
  getActivityHash,
  getLastNotEmptyAccountIndex,
  handleUnknownError,
  isNotFoundError,
  toShiftedBigNumber,
  watchUntilTruthy,
} from '@/utils';
import Logger from '@/lib/logger';

import type {
  AeNetworkProtocolSettings,
  ContractInitializeOptions,
} from '@/protocols/aeternity/types';
import {
  AE_COIN_PRECISION,
  AE_COINGECKO_COIN_ID,
  AE_CONTRACT_ID,
  AE_MDW_TO_NODE_APPROX_DELAY_TIME,
  AE_NETWORK_DEFAULT_ENV_SETTINGS,
  AE_NETWORK_DEFAULT_SETTINGS,
  AE_PROTOCOL_NAME,
  AE_SYMBOL,
  ACTIVITIES_TYPES,
  SEED_LENGTH,
} from '@/protocols/aeternity/config';
import { AeScan } from '@/protocols/aeternity/libs/AeScan';
import { useAeMiddleware, useAeNetworkSettings, useAeTokenSales } from '@/protocols/aeternity/composables';

import { aettosToAe } from '../helpers';

/** Each transfer on a page can need the events of its transaction fetched */
const TOKEN_TRANSFERS_PER_PAGE = 10;
const TRANSACTION_ACTIVITIES_CACHE_SIZE = 500;
/** Polling the first page of a token doesn't fetch the events of its transactions again */
const transactionActivities = new Map<string, any[]>();
/** By the middleware URL */
const tokenTransfersSupport = new Map<string, Promise<boolean>>();

/** The token transfers by account include the mints and burns since mdw 1.109 */
function isTokenTransfersVersion(mdwVersion?: string) {
  const [major, minor] = (mdwVersion || '').split('.').map(Number);
  return major > 1 || (major === 1 && minor >= 109);
}

export class AeternityAdapter extends BaseProtocolAdapter {
  override protocol = PROTOCOLS.aeternity;

  override protocolName = AE_PROTOCOL_NAME;

  override coinName = AE_PROTOCOL_NAME;

  override coinSymbol = AE_SYMBOL;

  override coinContractId = AE_CONTRACT_ID;

  override coinPrecision = AE_COIN_PRECISION;

  override coinGeckoCoinId = AE_COINGECKO_COIN_ID;

  override hasTokensSupport = true;

  override mdwToNodeApproxDelayTime = AE_MDW_TO_NODE_APPROX_DELAY_TIME;

  private networkSettings: AdapterNetworkSettingList<AeNetworkProtocolSettings> = [
    {
      key: 'nodeUrl',
      testId: 'ae-node-url',
      required: true,
      defaultValue: AE_NETWORK_DEFAULT_ENV_SETTINGS.nodeUrl,
      getPlaceholder: () => tg('pages.network.networkUrlPlaceholder'),
      getLabel: () => tg('pages.network.networkUrlLabel'),
    },
    {
      key: 'middlewareUrl',
      testId: 'ae-middleware-url',
      required: true,
      defaultValue: AE_NETWORK_DEFAULT_ENV_SETTINGS.middlewareUrl,
      getPlaceholder: () => tg('pages.network.networkMiddlewarePlaceholder'),
      getLabel: () => tg('pages.network.networkMiddlewareLabel'),
    },
    {
      key: 'backendUrl',
      required: true,
      defaultValue: AE_NETWORK_DEFAULT_ENV_SETTINGS.backendUrl,
      getPlaceholder: () => tg('pages.network.backendUrlPlaceholder'),
      getLabel: () => tg('pages.network.backendUrlLabel'),
    },
    {
      key: 'explorerUrl',
      required: true,
      defaultValue: AE_NETWORK_DEFAULT_ENV_SETTINGS.explorerUrl,
      getPlaceholder: () => tg('pages.network.explorerUrlPlaceholder'),
      getLabel: () => tg('pages.network.explorerUrlLabel'),
    },
  ];

  override getAccountPrefix() {
    return `${Encoding.AccountAddress}_`;
  }

  override getExplorer() {
    const { aeActiveNetworkSettings, aeActiveNetworkPredefinedSettings } = useAeNetworkSettings();
    return new AeScan(
      aeActiveNetworkSettings.value.explorerUrl
      ?? aeActiveNetworkPredefinedSettings.value.explorerUrl,
    );
  }

  override getAmountPrecision({ highPrecision, amount }: IAmountDecimalPlaces = {}): number {
    return (highPrecision || (amount && amount < 0.01)) ? 9 : 2;
  }

  override getUrlTokenKey(): string {
    return AE_SYMBOL;
  }

  override getDefaultCoin(
    marketData?: MarketData,
    convertedBalance?: number,
  ): ICoin {
    return {
      ...(marketData?.[PROTOCOLS.aeternity]! || {} as MarketData),
      protocol: PROTOCOLS.aeternity,
      contractId: this.coinContractId,
      decimals: this.coinPrecision,
      name: this.coinName,
      symbol: this.coinSymbol,
      convertedBalance,
      price: 1,
    };
  }

  override getNetworkSettings() {
    return this.networkSettings;
  }

  override getNetworkTypeDefaultValues(networkType: NetworkTypeDefault) {
    return AE_NETWORK_DEFAULT_SETTINGS[networkType] as any;
  }

  override async fetchBalance(address: Encoded.AccountAddress): Promise<string> {
    const { getAeSdk, setAeNodeError } = useAeSdk();
    const sdk = await getAeSdk();

    try {
      const balanceInAettos = await sdk.getBalance(address);
      setAeNodeError(false);
      return aettosToAe(balanceInAettos);
    } catch (e) {
      setAeNodeError(true);
      throw e;
    }
  }

  override isAccountAddressValid(address: string) {
    return isAddressValid(address, Encoding.AccountAddress);
  }

  override isValidAddressOrNameEncoding(address: string) {
    return isAddressValid(address, Encoding.ContractAddress)
      || isAddressValid(address, Encoding.AccountAddress)
      || isAddressValid(address, Encoding.Name);
  }

  override async isAccountUsed(address: string): Promise<boolean> {
    const { getDryAeSdk } = useAeSdk();
    const aeSdk = await getDryAeSdk();
    return aeSdk.api.getAccountByPubkey(address).then(
      () => true,
      (error) => {
        // The node doesn't know accounts that never received anything.
        if (isNotFoundError(error)) return false;
        throw error;
      },
    );
  }

  protected override deriveHdWalletAccountFromMnemonicSeed(
    seed: Uint8Array,
    accountIndex: number,
  ): IHdWalletAccount {
    const account = (new AccountMnemonicFactory(seed)).initializeSync(accountIndex);
    return {
      ...account,
      publicKey: Buffer.from(account.address),
      secretKey: decode(account.secretKey),
    };
  }

  override resolveAccountRaw(
    rawAccount: IAccountRaw,
    idx: number,
    globalIdx: number,
    seed?: Uint8Array,
  ): IAccount | null {
    if (rawAccount.type === ACCOUNT_TYPES.privateKey && rawAccount.privateKey) {
      const bufferFromPrivateKey = rawAccount.privateKey.length === SEED_LENGTH
        ? Buffer.from(rawAccount.privateKey)
        : Buffer.from(rawAccount.privateKey).subarray(0, SEED_LENGTH);
      const { address } = new MemoryAccount(
        encode(bufferFromPrivateKey, Encoding.AccountSecretKey),
      );
      return {
        idx,
        globalIdx,
        secretKey: bufferFromPrivateKey,
        ...rawAccount,
        privateKey: undefined,
        address,
        publicKey: Buffer.from(decode(address)),
      };
    }
    if (rawAccount.type === ACCOUNT_TYPES.hdWallet && seed) {
      return {
        globalIdx,
        idx,
        ...rawAccount,
        ...this.getHdWalletAccountFromMnemonicSeed(seed, idx),
      };
    }
    if (rawAccount.type === ACCOUNT_TYPES.airGap || rawAccount.type === ACCOUNT_TYPES.ledger) {
      return {
        globalIdx,
        idx,
        ...rawAccount,
        publicKey: Buffer.from(decode(rawAccount.address as Encoded.AccountAddress)),
      } as any as IAccount; // https://github.com/superhero-com/superhero-wallet/issues/3312
    }
    return null;
  }

  override async discoverLastUsedAccountIndex(seed: Uint8Array): Promise<number> {
    return getLastNotEmptyAccountIndex(
      this.isAccountUsed.bind(this),
      this.getHdWalletAccountFromMnemonicSeed.bind(this),
      seed,
    );
  }

  async fetchTokenInfo?(contractId: AssetContractId)
    : Promise<IToken | undefined> {
    const { fetchFromMiddlewareCamelCased } = useAeMiddleware();
    try {
      return await fetchFromMiddlewareCamelCased(`/v3/aex9/${contractId}`);
    } catch (error) {
      return undefined;
    }
  }

  override async fetchAvailableTokens(): Promise<IToken[]> {
    const firstPage = await this.fetchAvailableTokensPage();
    return firstPage?.data || [];
  }

  private async fetchAex9TokensPage(
    path: string,
  ): Promise<IPageableResponse<IToken> | null> {
    const { fetchFromMiddleware } = useAeMiddleware();
    const response = camelCaseKeysDeep(
      await fetchFromMiddleware(path),
    ) as IPageableResponse<Omit<IToken, 'protocol'>> | null;

    if (!response) {
      return null;
    }

    return {
      ...response,
      data: (response.data || []).map((token) => ({ ...token, protocol: PROTOCOLS.aeternity })),
    };
  }

  override async fetchAvailableTokensPage(
    nextPageUrl?: string,
  ): Promise<IPageableResponse<IToken> | null> {
    return this.fetchAex9TokensPage(
      nextPageUrl || '/v3/aex9?by=name&limit=100&direction=forward',
    );
  }

  override async fetchAvailableTokensSearchPage(
    searchTerm: string,
    searchBy: 'name' | 'symbol',
    nextPageUrl?: string,
  ): Promise<IPageableResponse<IToken> | null> {
    const searchPath = `/v3/aex9?by=${searchBy}&prefix=${encodeURIComponent(
      searchTerm,
    )}&limit=100&direction=forward`;

    return this.fetchAex9TokensPage(nextPageUrl || searchPath);
  }

  override async fetchAccountTokenBalances(address: string): Promise<ITokenBalance[] | null> {
    const { fetchFromMiddleware } = useAeMiddleware();
    const { loadAllTokenSalesInfoByAccount, tokenSales } = useAeTokenSales();
    try {
      const [tokens]: ITokenBalanceResponse[][] = await Promise.all(
        [
          camelCaseKeysDeep(await fetchAllPages(
            () => fetchFromMiddleware(`/v3/accounts/${address}/aex9/balances?limit=100`),
            fetchFromMiddleware,
          )),
          loadAllTokenSalesInfoByAccount(address as Encoded.AccountAddress),
        ],
      );
      return tokens.map(({
        amount, contractId, decimals, tokenName, tokenSymbol,
      }) => ({
        address,
        amount,
        contractId,
        convertedBalance: +amountRounded(toShiftedBigNumber(amount, -decimals)),
        decimals,
        name: tokenName,
        symbol: tokenSymbol,
        protocol: PROTOCOLS.aeternity,
        price: tokenSales.value.find((token) => token.address === contractId)?.price ?? 0,
      }));
    } catch (error: any) {
      handleUnknownError(error);
    }
    return null;
  }

  override async transferToken(
    amount: AssetAmount,
    recipient: string,
    contractId: string,
    options: ContractInitializeOptions,
  ) {
    const { getAeSdk } = useAeSdk();
    const aeSdk = await getAeSdk();
    const tokenContract = await Contract.initialize({
      ...aeSdk.getContext(),
      aci: FungibleTokenFullInterfaceACI,
      address: contractId as Encoded.ContractAddress,
    });
    // The dry run that prices the gas only takes the nonce after the chain's,
    // not one after pending transactions.
    const { nonce, ...estimateOptions } = options;
    const gasLimit = await tokenContract._estimateGas(
      'transfer',
      [recipient, amount],
      estimateOptions,
    );
    return tokenContract.transfer(recipient, amount, { ...options, gasLimit });
  }

  async fetchRegularTransactions(
    address: string,
    limit: number,
    nextPageUrl?: string,
  ) {
    const {
      fetchFromMiddlewareCamelCased,
      normalizeActivitiesStructure,
      normalizeMiddlewareTransactionStructure,
    } = useAeMiddleware();
    const url = nextPageUrl || `/v3/accounts/${address}/activities?limit=${limit}`;

    const { data, next } = await fetchFromMiddlewareCamelCased(url);

    // The events of a contract call can continue on the next page
    const lastActivity = data.at(-1);
    const lastActivityType = lastActivity?.type;
    if (
      (
        lastActivityType === ACTIVITIES_TYPES.aex9TransferEvent
        || lastActivityType === ACTIVITIES_TYPES.contractCallTxEvent
        || lastActivityType === ACTIVITIES_TYPES.internalContractCallEvent
        || lastActivityType === ACTIVITIES_TYPES.internalTransferEvent
      )
      && next
    ) {
      const additionalActivities = await fetchFromMiddlewareCamelCased(`${next.split('&limit=')[0]}&limit=5`);
      additionalActivities.data.forEach((activity: any) => {
        if (getActivityHash(activity) === getActivityHash(lastActivity)) {
          data.push(activity);
        }
      });
    }
    const regularTransactions = normalizeActivitiesStructure(data || [])
      .map((responseData: any) => normalizeMiddlewareTransactionStructure(responseData, address));

    return {
      regularTransactions,
      nextPageUrl: next,
    };
  }

  override async fetchPendingTransactions(
    address: string,
  ) {
    try {
      const { getAeSdk } = useAeSdk();
      const sdk = await getAeSdk();
      const fetchedPendingTransaction = (
        await sdk.api.getPendingAccountTransactionsByPubkey(address)
      );

      return JsonBig.parse(JsonBig.stringify(
        fetchedPendingTransaction?.transactions || [],
      )).map((transaction: ITransaction) => ({
        ...transaction,
        pending: true,
        protocol: PROTOCOLS.aeternity,
        microTime: Date.now(),
        transactionOwner: address,
      }));
    } catch (error) {
      return [];
    }
  }

  override async fetchAccountTransactions(
    address: AccountAddress,
    { nextPageUrl }: ITransactionApiPaginationParams = {},
  ): Promise<IFetchTransactionResult> {
    let paginationParams: ITransactionApiPaginationParams = {};

    const [
      { regularTransactions = [], nextPageUrl: newNextPageUrl },
      pendingTransactions,
    ] = await Promise.all([
      this.fetchRegularTransactions(address, TXS_PER_PAGE, nextPageUrl),
      this.fetchPendingTransactions(address),
    ]);

    if (newNextPageUrl) {
      paginationParams.nextPageUrl = newNextPageUrl;
    }

    return {
      regularTransactions,
      pendingTransactions,
      paginationParams,
    };
  }

  override async fetchAccountAssetTransactions(
    address: AccountAddress,
    assetContractId: AssetContractId,
    { nextPageUrl }: ITransactionApiPaginationParams = {},
  ): Promise<IFetchTransactionResult> {
    let paginationParams: ITransactionApiPaginationParams = {};
    let regularTransactions: ITransaction[] = [];

    try {
      if (
        assetContractId !== this.coinContractId
        // A list continues from where its pages were loaded
        && (nextPageUrl ? nextPageUrl.startsWith('/v3/aex9/') : await this.isTokenTransfersSupported())
      ) {
        const res = await this.fetchTokenTransactions(address, assetContractId, nextPageUrl);
        regularTransactions = res.regularTransactions;
        if (res.nextPageUrl) {
          paginationParams.nextPageUrl = res.nextPageUrl;
        }
      } else {
        // The middleware can't list the AE coin transactions only, nor the token ones
        // with their mints and burns before 1.109, so they are filtered here
        const res = await this.fetchAccountTransactions(address, { nextPageUrl });
        paginationParams = res.paginationParams;
        regularTransactions = res.regularTransactions.filter(({ tx }) => (
          (assetContractId === this.coinContractId)
            ? !tx.contractId || tx.contractId === this.coinContractId
            : (
              tx.contractId === assetContractId
              || JSON.stringify({ ...tx.arguments, ...tx.log }).includes(assetContractId)
            )
        ));
      }
    } catch (error: any) {
      Logger.write(error);
      throw error;
    }

    return {
      paginationParams,
      regularTransactions,
    };
  }

  private async isTokenTransfersSupported(): Promise<boolean> {
    const { aeActiveNetworkSettings } = useAeNetworkSettings();
    await watchUntilTruthy(aeActiveNetworkSettings);
    // Read once, so a network switch meanwhile can't store the answer of another middleware
    const { middlewareUrl } = aeActiveNetworkSettings.value;
    let isSupported = tokenTransfersSupport.get(middlewareUrl);
    if (!isSupported) {
      isSupported = fetchJson(`${middlewareUrl}/v3/status`)
        .then((status) => isTokenTransfersVersion(status?.mdw_version));
      tokenTransfersSupport.set(middlewareUrl, isSupported);
      isSupported.catch(() => tokenTransfersSupport.delete(middlewareUrl));
    }
    return isSupported;
  }

  private async fetchTokenTransactions(
    address: AccountAddress,
    contractId: AssetContractId,
    nextPageUrl?: string,
  ): Promise<{ regularTransactions: ITransaction[]; nextPageUrl?: string }> {
    const { fetchFromMiddlewareCamelCased } = useAeMiddleware();
    const { data, next } = await fetchFromMiddlewareCamelCased(
      nextPageUrl
      || `/v3/aex9/${encodeURIComponent(contractId)}/transfers?account=${encodeURIComponent(address)}&limit=${TOKEN_TRANSFERS_PER_PAGE}`,
    );
    const transactions = await Promise.all(
      uniq<string>(data.map(({ txHash }: any) => txHash))
        .map((hash) => this.fetchTokenTransaction(address, contractId, hash)),
    );
    return {
      regularTransactions: transactions.filter((transaction) => !!transaction) as ITransaction[],
      nextPageUrl: next,
    };
  }

  /**
   * Like the activities, the account's own transactions are shown whole
   * and the transactions of others only by the tokens they moved.
   */
  private async fetchTokenTransaction(
    address: AccountAddress,
    contractId: AssetContractId,
    hash: string,
  ): Promise<ITransaction | undefined> {
    const {
      normalizeActivitiesStructure,
      normalizeMiddlewareTransactionStructure,
    } = useAeMiddleware();
    // Normalizing changes the objects, the cached ones stay as fetched
    const activities = cloneDeep(await this.fetchTransactionActivities(address, hash));

    // The account is in the transaction itself. Other transactions of the generation that
    // come along have no such activity.
    const [ownTransaction] = normalizeActivitiesStructure(activities)
      .filter(({ type }) => (
        type !== ACTIVITIES_TYPES.aex9TransferEvent
        && type !== ACTIVITIES_TYPES.internalContractCallEvent
      ));
    if (ownTransaction) {
      return normalizeMiddlewareTransactionStructure(ownTransaction, address);
    }

    const transfers = activities.filter(({ type, payload }) => (
      type === ACTIVITIES_TYPES.aex9TransferEvent && payload.contractId === contractId
    ));
    if (transfers.length < 2) {
      return transfers[0] && normalizeMiddlewareTransactionStructure(transfers[0], address);
    }
    // Several transfers are shown as one by the amount the account got or gave
    const netAmount = sumBy(transfers, ({ payload }) => (
      (payload.recipientId === address ? payload.amount : 0)
      - (payload.senderId === address ? payload.amount : 0)
    ));
    if (!netAmount) {
      return undefined;
    }
    const transfer = transfers.find(({ payload }) => (
      (netAmount > 0)
        ? payload.recipientId === address && payload.senderId !== address
        : payload.senderId === address
    ));
    return normalizeMiddlewareTransactionStructure(
      { ...transfer, payload: { ...transfer.payload, amount: Math.abs(netAmount) } },
      address,
    );
  }

  private async fetchTransactionActivities(
    address: AccountAddress,
    hash: string,
  ): Promise<any[]> {
    const key = `${address}:${hash}`;
    let activities = transactionActivities.get(key);
    if (!activities) {
      const { fetchFromMiddlewareCamelCased } = useAeMiddleware();
      // 100 is the most the middleware returns
      const { data } = await fetchFromMiddlewareCamelCased(
        `/v3/accounts/${encodeURIComponent(address)}/activities?scope=transaction:${encodeURIComponent(hash)}&limit=100`,
      );
      activities = data as any[];
      if (transactionActivities.size >= TRANSACTION_ACTIVITIES_CACHE_SIZE) {
        transactionActivities.clear();
      }
      transactionActivities.set(key, activities);
    }
    return activities;
  }

  async fetchTransactionByHash(
    hash: string,
    transactionOwner?: AccountAddress,
  ): Promise<ITransaction> {
    const { fetchTransaction } = useAeMiddleware();

    return {
      ...await fetchTransaction(hash),
      protocol: PROTOCOLS.aeternity,
      transactionOwner,
    };
  }

  override constructAndSignTx(): Promise<any> {
    throw new Error('Method not implemented.');
  }

  override async spend(
    amount: number | string,
    recipient: string,
    options: { payload: string; nonce: number; fee?: string },
  ): Promise<ITransferResponse> {
    const { getAeSdk } = useAeSdk();
    const aeSdk = await getAeSdk();
    return aeSdk.spendWithCustomOptions(
      amount,
      recipient as Encoded.AccountAddress,
      {
        waitMined: false,
        payload: encode(Buffer.from(options.payload), Encoding.Bytearray),
        nonce: options.nonce,
        fee: options.fee,
      },
    );
  }

  override async waitTransactionMined(hash: string): Promise<any> {
    return useAeSdk().waitTransactionMined(hash as Encoded.TxHash);
  }
}
