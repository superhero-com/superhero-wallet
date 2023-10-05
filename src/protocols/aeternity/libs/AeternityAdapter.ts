/* eslint-disable class-methods-use-this */
import JsonBig from '@/lib/json-big';
import {
  encode,
  Encoded,
  Encoding,
  getHdWalletAccountFromSeed,
  Tag,
} from '@aeternity/aepp-sdk';
import { Store, useStore } from 'vuex';

import type {
  AdapterNetworkSettingList,
  ICoin,
  IHdWalletAccount,
  MarketData,
  NetworkTypeDefault,
  IFetchTransactionResult,
  ITransaction,
} from '@/types';
import { PROTOCOL_AETERNITY, TXS_PER_PAGE } from '@/constants';
import { useAeSdk } from '@/composables/aeSdk';
import { BaseProtocolAdapter } from '@/protocols/BaseProtocolAdapter';
import { tg } from '@/popup/plugins/i18n';
import { fetchJson, getLastNotEmptyAccountIndex } from '@/utils';

import type { AeNetworkProtocolSettings } from '@/protocols/aeternity/types';
import {
  AE_COIN_NAME,
  AE_COIN_PRECISION,
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
  store: Store<any> | undefined;

  protocolName = AE_PROTOCOL_NAME;

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

  /**
   * TODO remove any store dependencies ASAP
   * The `useStore` should not be used out of component scope.
   */
  getStore(): Store<any> {
    if (!this.store) {
      this.store = useStore();
    }
    return this.store;
  }

  override getAccountPrefix() {
    return `${Encoding.AccountAddress}_`;
  }

  override getExplorer(): any {
    const { aeActiveNetworkPredefinedSettings } = useAeNetworkSettings();

    return new AeScan(aeActiveNetworkPredefinedSettings.value.explorerUrl!);
  }

  override getAmountPrecision({ highPrecision, amount }: IAmountDecimalPlaces): number {
    return (highPrecision || (amount && amount < 0.01)) ? 9 : 2;
  }

  override getCoinSymbol(getShort = false) {
    return getShort ? AE_SYMBOL_SHORT : AE_SYMBOL;
  }

  override getUrlTokenKey(): string {
    return AE_SYMBOL;
  }

  override getCoinGeckoCoinId() {
    return AE_COINGECKO_COIN_ID;
  }

  override getDefaultAssetContractId() {
    return AE_CONTRACT_ID;
  }

  override getDefaultCoin(
    marketData: MarketData,
    convertedBalance?: number,
  ): ICoin {
    return {
      ...(marketData?.[PROTOCOL_AETERNITY] || {}),
      contractId: AE_CONTRACT_ID,
      // TODO - check usages why sometimes it's a bignumber
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
    const store = this.getStore();
    const { getAeSdk } = useAeSdk({ store });
    const sdk = await getAeSdk();
    const balanceInAettos = await sdk.getBalance(address);
    return aettosToAe(balanceInAettos);
  }

  override async isAccountUsed(address: string): Promise<boolean> {
    const store = this.getStore();
    const { getDryAeSdk } = useAeSdk({ store });
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

  override async getTransactionByHash(): Promise<any> {
    // TODO
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
        regularTransactions: data || [],
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
      const store = useStore();
      const { getAeSdk } = useAeSdk({ store });
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
      const store = useStore();
      const { getAeSdk } = useAeSdk({ store });
      const { aeActiveNetworkSettings } = useAeNetworkSettings();
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
    const store = useStore();
    const { getAeSdk } = useAeSdk({ store });
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
  ): Promise<{ hash: string }> {
    const store = this.getStore();
    const { getAeSdk } = useAeSdk({ store });
    const aeSdk = await getAeSdk();
    return aeSdk.spendWithCustomOptions(amount, recipient as any, {
      payload: encode(Buffer.from(options.payload), Encoding.Bytearray),
      modal: false,
    });
  }
}
