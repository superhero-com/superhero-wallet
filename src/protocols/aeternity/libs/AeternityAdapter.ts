/* eslint-disable class-methods-use-this */
import {
  encode,
  Encoded,
  Encoding,
  getHdWalletAccountFromSeed,
} from '@aeternity/aepp-sdk';
import { Store, useStore } from 'vuex';

import type {
  AdapterNetworkSettingList,
  ICoin,
  IHdWalletAccount,
  MarketData,
  NetworkTypeDefault,
} from '@/types';
import { PROTOCOL_AETERNITY } from '@/constants';
import { useAeSdk } from '@/composables/aeSdk';
import { BaseProtocolAdapter } from '@/protocols/BaseProtocolAdapter';
import { tg } from '@/store/plugins/languages';
import { defaultAccountDiscovery } from '@/utils';

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
    const result = await aeSdk.api.getAccountByPubkey(address).then(() => true, () => false);
    return result;
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

  override async discoverAccounts(seed: Uint8Array): Promise<number> {
    return defaultAccountDiscovery(
      this.isAccountUsed,
      this.getHdWalletAccountFromMnemonicSeed,
      seed,
    );
  }

  override async constructAndSignTx() {
    // TODO
  }

  override async getTransactionByHash(): Promise<any> {
    // TODO
  }

  override async fetchTransactions(): Promise<any> {
    // TODO
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
