/* eslint-disable class-methods-use-this */

import * as ecc from '@bitcoin-js/tiny-secp256k1-asmjs';
import { BIP32Factory } from 'bip32';
import { payments, networks } from 'bitcoinjs-lib';
import type {
  AdapterNetworkSettingList,
  ICoin,
  IHdWalletAccount,
  INetworkProtocolSettings,
  MarketData,
  NetworkTypeDefault,
} from '@/types';
import {
  MAXIMUM_ACCOUNTS_TO_DISCOVER,
  PROTOCOL_BITCOIN,
} from '@/constants';
import { tg } from '@/store/plugins/languages';
import { BaseProtocolAdapter } from '@/protocols/BaseProtocolAdapter';
import {
  BTC_COIN_NAME,
  BTC_COIN_PRECISION,
  BTC_NETWORK_DEFAULT_SETTINGS,
  BTC_COINGECKO_COIN_ID,
  BTC_CONTRACT_ID,
  BTC_SYMBOL,
} from '@/protocols/bitcoin/config';

export class BitcoinAdapter extends BaseProtocolAdapter {
  protocolName = 'Bitcoin';

  bip32 = BIP32Factory(ecc);

  networkSettings: AdapterNetworkSettingList = [
    {
      key: 'nodeUrl',
      testId: 'url',
      getPlaceholder: () => tg('pages.network.networkUrlPlaceholder'),
      getLabel: () => tg('pages.network.networkUrlLabel'),
    },
  ];

  override getCoinSymbol() {
    return BTC_SYMBOL;
  }

  getNetworkSettings() {
    return this.networkSettings;
  }

  getNetworkTypeDefaultValues(networkType: NetworkTypeDefault): INetworkProtocolSettings {
    return BTC_NETWORK_DEFAULT_SETTINGS[networkType];
  }

  override getCoinGeckoCoinId() {
    return BTC_COINGECKO_COIN_ID;
  }

  override getDefaultAssetContractId() {
    return BTC_CONTRACT_ID;
  }

  override getDefaultCoin(
    marketData: MarketData,
    convertedBalance?: number,
  ): ICoin {
    return {
      ...(marketData?.[PROTOCOL_BITCOIN] || {}),
      contractId: BTC_CONTRACT_ID,
      symbol: BTC_SYMBOL,
      decimals: BTC_COIN_PRECISION,
      name: BTC_COIN_NAME,
      convertedBalance,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  override async getBalance(address: string): Promise<string> {
    // TODO: Implement this once the mdw is ready
    return Promise.resolve('989983200000000000');
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  override async isAccountUsed(address: string): Promise<boolean> {
    // TODO: Implement this
    return true;
  }

  override getHdWalletAccountFromMnemonicSeed(
    seed: Uint8Array,
    accountIndex: number,
  ): IHdWalletAccount {
    const node = this.bip32.fromSeed(Buffer.from(seed));
    const path = `m/84'/0'/${accountIndex}'/0/0`; // 44 for Legacy
    const child = node.derivePath(path);
    const { address } = payments.p2wpkh({ // p2pkh for Legacy
      pubkey: child.publicKey,
      // TODO: use bitcoin.networks.testnet once the network selection is ready
      network: networks.bitcoin,
    });
    const secretKey = child.toWIF();

    return {
      secretKey,
      publicKey: child.publicKey!.toString('utf8'),
      address: address!,
    };
  }

  override async discoverAccounts(seed: Uint8Array): Promise<number> {
    let lastNotEmptyIdx = 0;

    for (let i = 0; i < MAXIMUM_ACCOUNTS_TO_DISCOVER; i += 1) {
      const account = this.getHdWalletAccountFromMnemonicSeed(seed, i);
      // eslint-disable-next-line no-await-in-loop
      if (await this.isAccountUsed(account.publicKey)) {
        lastNotEmptyIdx = i;
      }
    }
    return lastNotEmptyIdx;
  }
}
