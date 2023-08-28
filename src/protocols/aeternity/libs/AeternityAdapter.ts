/* eslint-disable class-methods-use-this */
import {
  encode,
  Encoded,
  Encoding,
  getHdWalletAccountFromSeed,
} from '@aeternity/aepp-sdk';
import { useStore } from 'vuex';

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

/**
 * Address gap limit is currently set to 5.
 * If the software hits 5 unused addresses in a row,
 * it expects there are no used addresses beyond this point and stops searching the address chain.
*/
const ADDRESS_GAP_LIMIT = 5;

interface IAmountDecimalPlaces {
  highPrecision?: boolean;
  amount?: number;
}

export class AeternityAdapter extends BaseProtocolAdapter {
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
      key: 'compilerUrl',
      testId: 'ae-compiler-url',
      required: true,
      defaultValue: AE_NETWORK_DEFAULT_ENV_SETTINGS.compilerUrl,
      getPlaceholder: () => tg('pages.network.networkCompilerPlaceholder'),
      getLabel: () => tg('pages.network.networkCompilerLabel'),
    },
    {
      key: 'backendUrl',
      required: true,
      defaultValue: AE_NETWORK_DEFAULT_ENV_SETTINGS.backendUrl,
      getPlaceholder: () => tg('pages.network.backendUrlPlaceholder'),
      getLabel: () => tg('pages.network.backendUrlLabel'),
    },
  ];

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

  getNetworkSettings() {
    return this.networkSettings;
  }

  getNetworkTypeDefaultValues(networkType: NetworkTypeDefault) {
    return AE_NETWORK_DEFAULT_SETTINGS[networkType] as any;
  }

  override async fetchBalance(address: Encoded.AccountAddress): Promise<string> {
    const store = useStore();
    const { getAeSdk } = useAeSdk({ store });
    const sdk = await getAeSdk();
    const balanceInAettos = await sdk.getBalance(address);
    return aettosToAe(balanceInAettos);
  }

  override async isAccountUsed(address: string): Promise<boolean> {
    const store = useStore();
    const { getAeSdk } = useAeSdk({ store });
    const aeSdk = await getAeSdk();
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

  override async discoverAccounts(seed: Uint8Array): Promise<number> {
    let lastNotEmptyIdx = 0;
    let lastIndex = 0;
    let isAccountUsedArray: Boolean[] = [];

    do {
      try {
        lastNotEmptyIdx = isAccountUsedArray.lastIndexOf(true) + lastIndex;
        lastIndex += isAccountUsedArray.length;
        // eslint-disable-next-line no-await-in-loop
        isAccountUsedArray = await Promise.all(
          Array(ADDRESS_GAP_LIMIT + lastNotEmptyIdx - lastIndex + 1)
            // eslint-disable-next-line no-loop-func
            .fill(0).map((x, i) => i + lastIndex).map((index) => this.isAccountUsed(
              this.getHdWalletAccountFromMnemonicSeed(seed, index).publicKey,
            )),
        );
      } catch (e) {
        break;
      }
    } while (!(
      isAccountUsedArray.lastIndexOf(true) === -1
      || isAccountUsedArray.filter((isAccountUsed) => !isAccountUsed).length === ADDRESS_GAP_LIMIT
    ));
    return lastNotEmptyIdx;
  }

  async constructAndSignTx() {
    // TODO
  }

  async getTransactionByHash(): Promise<any> {
    // TODO
  }

  async fetchTransactions(): Promise<any> {
    // TODO
  }

  override async spend(
    amount: number,
    recipient: string,
    options: { payload: string },
  ): Promise<{ hash: string }> {
    const store = useStore();
    const { getAeSdk } = useAeSdk({ store });
    const aeSdk = await getAeSdk();
    return aeSdk.spendWithCustomOptions(amount, recipient as any, {
      payload: encode(Buffer.from(options.payload), Encoding.Bytearray),
      modal: false,
    });
  }
}
