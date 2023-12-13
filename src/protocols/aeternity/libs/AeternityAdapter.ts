/* eslint-disable class-methods-use-this */
import JsonBig from '@/lib/json-big';
import {
  encode,
  Encoded,
  Encoding,
  getHdWalletAccountFromSeed,
  isAddressValid,
  Tag,
} from '@aeternity/aepp-sdk';
import camelCaseKeysDeep from 'camelcase-keys-deep';

import type {
  AdapterNetworkSettingList,
  AssetContractId,
  ICoin,
  IHdWalletAccount,
  MarketData,
  NetworkTypeDefault,
  IFetchTransactionResult,
  ITransaction,
  IToken,
  ITokenBalance,
  ITokenBalanceResponse,
  ITransferResponse,
} from '@/types';
import { PROTOCOLS, TXS_PER_PAGE } from '@/constants';
import { useAeSdk } from '@/composables/aeSdk';
import { BaseProtocolAdapter } from '@/protocols/BaseProtocolAdapter';
import { tg } from '@/popup/plugins/i18n';
import {
  fetchAllPages,
  fetchJson,
  getLastNotEmptyAccountIndex,
  handleUnknownError,
  toShiftedBigNumber,
} from '@/utils';

import type { AeNetworkProtocolSettings } from '@/protocols/aeternity/types';
import {
  AE_COIN_NAME,
  AE_COIN_PRECISION,
  AE_COIN_SYMBOL,
  AE_COINGECKO_COIN_ID,
  AE_CONTRACT_ID,
  AE_NETWORK_DEFAULT_ENV_SETTINGS,
  AE_NETWORK_DEFAULT_SETTINGS,
  AE_PROTOCOL_NAME,
  AE_SYMBOL,
  AE_SYMBOL_SHORT,
} from '@/protocols/aeternity/config';
import { AeScan } from '@/protocols/aeternity/libs/AeScan';
import { useAeNetworkSettings } from '@/protocols/aeternity/composables';
import { useMiddleware } from '@/composables/middleware';

import { aettosToAe } from '../helpers';

interface IAmountDecimalPlaces {
  highPrecision?: boolean;
  amount?: number;
}

export class AeternityAdapter extends BaseProtocolAdapter {
  override protocol = PROTOCOLS.aeternity;

  override protocolName = AE_PROTOCOL_NAME;

  coinPrecision = AE_COIN_PRECISION;

  networkSettings: AdapterNetworkSettingList<AeNetworkProtocolSettings> = [
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
  ];

  coinName = AE_COIN_SYMBOL;

  coinSymbol = AE_SYMBOL_SHORT;

  protocolSymbol = AE_SYMBOL;

  override getAccountPrefix() {
    return `${Encoding.AccountAddress}_`;
  }

  override getExplorer() {
    const { aeActiveNetworkPredefinedSettings } = useAeNetworkSettings();
    return new AeScan(aeActiveNetworkPredefinedSettings.value.explorerUrl!);
  }

  override getAmountPrecision({ highPrecision, amount }: IAmountDecimalPlaces): number {
    return (highPrecision || (amount && amount < 0.01)) ? 9 : 2;
  }

  override getUrlTokenKey(): string {
    return AE_SYMBOL;
  }

  override getCoinGeckoCoinId() {
    return AE_COINGECKO_COIN_ID;
  }

  override getCoinContractId(): AssetContractId {
    return AE_CONTRACT_ID;
  }

  override getDefaultCoin(
    marketData: MarketData,
    convertedBalance?: number,
  ): ICoin {
    return {
      ...(marketData?.[PROTOCOLS.aeternity] || {}),
      protocol: PROTOCOLS.aeternity,
      contractId: this.getCoinContractId(),
      decimals: AE_COIN_PRECISION,
      name: AE_COIN_NAME,
      symbol: AE_SYMBOL,
      convertedBalance,
    };
  }

  override getNetworkSettings() {
    return this.networkSettings;
  }

  override getNetworkTypeDefaultValues(networkType: NetworkTypeDefault) {
    return AE_NETWORK_DEFAULT_SETTINGS[networkType] as any;
  }

  override async fetchBalance(address: Encoded.AccountAddress): Promise<string> {
    const { getAeSdk } = useAeSdk();
    const sdk = await getAeSdk();
    const balanceInAettos = await sdk.getBalance(address);
    return aettosToAe(balanceInAettos);
  }

  override isAccountAddressValid(address: string) {
    return isAddressValid(address, Encoding.AccountAddress);
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

  /**
   * As the Aeternity protocol is the primary one we always return at least index 0 (one account).
   */
  override async discoverLastUsedAccountIndex(seed: Uint8Array): Promise<number> {
    const index = await getLastNotEmptyAccountIndex(
      this.isAccountUsed.bind(this),
      this.getHdWalletAccountFromMnemonicSeed.bind(this),
      seed,
    );
    return (index > -1) ? index : 0;
  }

  override async constructAndSignTx() {
    // TODO
  }

  override async fetchAvailableTokens(): Promise<IToken[]> {
    const { fetchFromMiddleware } = useMiddleware();
    const response: Omit<IToken, 'protocol'>[] = camelCaseKeysDeep(await fetchAllPages(
      () => fetchFromMiddleware('/v2/aex9?by=name&limit=100&direction=forward'),
      fetchFromMiddleware,
    ));
    return (response || []).map((token) => ({ ...token, protocol: PROTOCOLS.aeternity }));
  }

  override async fetchAccountTokenBalances(address: string): Promise<ITokenBalance[]> {
    const { fetchFromMiddleware } = useMiddleware();
    try {
      const tokens: ITokenBalanceResponse[] = camelCaseKeysDeep(await fetchAllPages(
        () => fetchFromMiddleware(`/v2/aex9/account-balances/${address}?limit=100`),
        fetchFromMiddleware,
      ));
      return tokens.map(({ amount, contractId, decimals }) => ({
        address,
        amount,
        contractId,
        convertedBalance: +toShiftedBigNumber(amount!, -decimals).toFixed(2),
        protocol: PROTOCOLS.aeternity,
      }));
    } catch (error: any) {
      handleUnknownError(error);
    }
    return [];
  }

  override async fetchTransactionByHash() {
    // TODO
  }

  override async fetchTokenInfo(): Promise<IToken | undefined> {
    // TODO if needed
    return undefined;
  }

  override async transferToken() {
    return undefined;
  }

  async fetchTransactionsFromMiddleware(
    address: string,
    nextPageUrl: string | null,
    limit: number,
  ) {
    const { fetchFromMiddlewareCamelCased } = useMiddleware();

    const url = ([null, ''].includes(nextPageUrl))
      ? `/v2/accounts/${address}/activities?limit=${limit}`
      : nextPageUrl!;

    try {
      const { data, next } = await fetchFromMiddlewareCamelCased(url);

      return {
        regularTransactions: (data || []).map((transaction: ITransaction) => ({
          ...transaction,
          protocol: PROTOCOLS.aeternity,
        })),
        nextPageParams: next,
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
      )).map((transaction: ITransaction) => ({ ...transaction, pending: true }));
    } catch (error) {
      return [];
    }
  }

  async fetchTipWithdrawnTransactions(address: string, recent: boolean) {
    try {
      const { aeActiveNetworkSettings } = useAeNetworkSettings();
      const { getAeSdk } = useAeSdk();
      await getAeSdk();

      const response = await fetchJson(
        `${aeActiveNetworkSettings.value.backendUrl}/cache/events/?address=${address}&event=TipWithdrawn${recent ? '&limit=5' : ''}`,
      );

      if (response.message) {
        return [];
      }

      // TODO prepare interface for response
      const tipWithdrawnTransactions: ITransaction[] = (response as any[]).map(({
        amount,
        contract,
        height,
        data: { tx },
        ...t
      }) => ({
        tx: {
          ...tx,
          address,
          amount,
          contractId: contract,
          type: Tag[Tag.ContractCallTx],
        },
        ...t,
        microTime: new Date(t.createdAt).getTime(),
        blockHeight: height,
        claim: true,
        protocol: PROTOCOLS.aeternity,
      }));

      return tipWithdrawnTransactions;
    } catch (error) {
      return [];
    }
  }

  override async fetchTransactions(
    address: string,
    nextPage: string | null,
  ): Promise<IFetchTransactionResult> {
    const { getAeSdk } = useAeSdk();
    await getAeSdk(); // Ensure the `nodeNetworkId` is established

    if (typeof nextPage !== 'string') {
      return {
        regularTransactions: [],
        nextPageParams: null,
      };
    }

    const [
      { regularTransactions, nextPageParams },
      pendingTransactions,
      tipWithdrawnTransactions,
    ] = await Promise.all([
      this.fetchTransactionsFromMiddleware(address, nextPage, TXS_PER_PAGE),
      this.fetchPendingTransactions(address),
      this.fetchTipWithdrawnTransactions(address, !nextPage),
    ]);

    return {
      regularTransactions,
      nextPageParams,
      pendingTransactions,
      tipWithdrawnTransactions,
    };
  }

  override async spend(
    amount: number,
    recipient: string,
    options: { payload: string },
  ): Promise<ITransferResponse> {
    const { getAeSdk } = useAeSdk();
    const aeSdk = await getAeSdk();
    return aeSdk.spendWithCustomOptions(amount, recipient as Encoded.AccountAddress, {
      payload: encode(Buffer.from(options.payload), Encoding.Bytearray),
    });
  }
}
