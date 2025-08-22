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
} from '@aeternity/aepp-sdk';
import { getHdWalletAccountFromSeed } from '@aeternity/aepp-sdk-13';
import camelCaseKeysDeep from 'camelcase-keys-deep';

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
  getActivityHash,
  getLastNotEmptyAccountIndex,
  handleUnknownError,
  toShiftedBigNumber,
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
} from '@/protocols/aeternity/config';
import { AeScan } from '@/protocols/aeternity/libs/AeScan';
import { useAeMiddleware, useAeNetworkSettings, useAeTokenSales } from '@/protocols/aeternity/composables';

import { aettosToAe } from '../helpers';

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
      return '0';
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
    return aeSdk.api.getAccountByPubkey(address).then(() => true, () => false);
  }

  override getHdWalletAccountFromMnemonicSeed(
    seed: Uint8Array,
    accountIndex: number,
  ): IHdWalletAccount {
    const account = getHdWalletAccountFromSeed(seed, accountIndex);
    return {
      ...account,
      publicKey: Buffer.from(account.publicKey),
      secretKey: Buffer.from(account.secretKey, 'hex'),
      address: account.publicKey,
    };
  }

  override resolveAccountRaw(
    rawAccount: IAccountRaw,
    idx: number,
    globalIdx: number,
    seed?: Uint8Array,
  ): IAccount | null {
    if (rawAccount.type === ACCOUNT_TYPES.privateKey && rawAccount.privateKey) {
      const { address } = new MemoryAccount(
        encode(Buffer.from(rawAccount.privateKey).subarray(0, 32), Encoding.AccountSecretKey),
      );
      return {
        idx,
        globalIdx,
        secretKey: Buffer.from(rawAccount.privateKey!),
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
      const token = await fetchFromMiddlewareCamelCased(`/v3/aex9/${contractId}`);
      if (token.error) {
        return undefined;
      }
      return token;
    } catch (error) {
      return undefined;
    }
  }

  override async fetchAvailableTokens(): Promise<IToken[]> {
    const { fetchFromMiddleware } = useAeMiddleware();
    const response: Omit<IToken, 'protocol'>[] = camelCaseKeysDeep(await fetchAllPages(
      () => fetchFromMiddleware('/v2/aex9?by=name&limit=100&direction=forward'),
      fetchFromMiddleware,
    ));
    return (response || []).map((token) => ({ ...token, protocol: PROTOCOLS.aeternity }));
  }

  override async fetchAccountTokenBalances(address: string): Promise<ITokenBalance[]> {
    const { fetchFromMiddleware } = useAeMiddleware();
    const { loadAllTokenSalesInfoByAccount, tokenSales } = useAeTokenSales();
    try {
      const [tokens]: ITokenBalanceResponse[][] = await Promise.all(
        [
          camelCaseKeysDeep(await fetchAllPages(
            () => fetchFromMiddleware(`/v2/aex9/account-balances/${address}?limit=100`),
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
    return [];
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
    return tokenContract.transfer(recipient, amount, options);
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
    /** @link https://github.com/aeternity/ae_mdw?tab=readme-ov-file#v2accountsidactivities */
    const url = nextPageUrl || `/v2/accounts/${address}/activities?limit=${limit}`;

    try {
      let { data, next } = await fetchFromMiddlewareCamelCased(url);

      // Some contract calls consist of several events
      // this condition checking edge case when not all events in one chunk
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
      let regularTransactions = normalizeActivitiesStructure(data || [])
        .map((responseData: any) => normalizeMiddlewareTransactionStructure(responseData, address));

      return {
        regularTransactions,
        nextPageUrl: next,
      };
    } catch (error) {
      return {};
    }
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
      // Aeternity protocol APIs has no way for fetching the AE Coin or Token transactions only.
      // For this purpose we are fetching all transactions and filter the asset.
      // TODO update the logic when this issue is closed: https://github.com/aeternity/ae_mdw/issues/1678
      const res = await this.fetchAccountTransactions(address, { nextPageUrl });
      paginationParams = res.paginationParams;

      if (assetContractId === this.coinContractId) {
        regularTransactions = res.regularTransactions
          .filter(({ tx }) => !tx.contractId || tx.contractId === this.coinContractId);
      } else {
        regularTransactions = res.regularTransactions
          .filter(({ tx }) => (
            tx.contractId === assetContractId
            || JSON.stringify({ ...tx.arguments, ...tx.log }).includes(assetContractId)
          ));
      }
    } catch (error: any) {
      Logger.write(error);
    }

    return {
      paginationParams,
      regularTransactions,
    };
  }

  async fetchTransactionByHash(
    hash: string,
    transactionOwner?: AccountAddress,
  ): Promise<ITransaction> {
    const { getMiddleware } = useAeMiddleware();
    const middleware = await getMiddleware();

    return {
      ...await middleware.getTx(hash),
      protocol: PROTOCOLS.aeternity,
      transactionOwner,
    };
  }

  override constructAndSignTx(): Promise<any> {
    throw new Error('Method not implemented.');
  }

  override async spend(
    amount: number,
    recipient: string,
    options: { payload: string; nonce: number },
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
      },
    );
  }

  override async waitTransactionMined(hash: string): Promise<any> {
    return useAeSdk().waitTransactionMined(hash as Encoded.TxHash);
  }
}
