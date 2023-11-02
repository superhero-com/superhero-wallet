/* eslint-disable class-methods-use-this */

import type {
  AdapterNetworkSettingList,
  ICoin,
  IHdWalletAccount,
  INetworkProtocolSettings,
  ITransaction,
} from '@/types';
import { BaseProtocolAdapter } from '@/protocols/BaseProtocolAdapter';
import {
  ETH_COINGECKO_COIN_ID,
  ETH_COIN_PRECISION,
  ETH_PROTOCOL_NAME,
  ETH_SYMBOL,
} from '../config';

export class EthereumAdapter extends BaseProtocolAdapter {
  override protocolName = ETH_PROTOCOL_NAME;

  override getAccountPrefix() {
    return ''; // TODO
  }

  override getAmountPrecision() {
    return ETH_COIN_PRECISION;
  }

  override getCoinSymbol() {
    return ETH_SYMBOL;
  }

  override getCoinGeckoCoinId() {
    return ETH_COINGECKO_COIN_ID;
  }

  override getExplorer() {
    // temp functions to avoid errors
    return {
      prepareUrlForHash(address: string): any {
        return address; // TODO
      },
      prepareUrlForAccount(address: string): any {
        return address; // TODO
      },
    };
  }

  override getUrlTokenKey() {
    return ''; // TODO
  }

  override getDefaultAssetContractId() {
    return ''; // TODO
  }

  override getDefaultCoin(): ICoin {
    // TODO: implement & remove this
    return {
      contractId: 'ethereum',
      decimals: 18,
      name: 'Ethereum',
      symbol: 'ETH',
      id: 'ethereum',
      lastUpdated: '2021-10-20T21:00:00.000Z',
      ath: 0,
      athChangePercentage: 0,
      athDate: '',
      atl: 0,
      atlChangePercentage: 0,
      atlDate: '',
      circulatingSupply: 0,
      currentPrice: 0,
      fullyDilutedValuation: 0,
      high24h: 0,
      low24h: 0,
      marketCap: 0,
      marketCapChange24h: 0,
      marketCapChangePercentage24h: 0,
      marketCapRank: 0,
      maxSupply: 0,
      priceChange24h: 0,
      priceChangePercentage24h: 0,
      roi: {},
      totalSupply: 0,
      totalVolume: 0,
    };
  }

  override getNetworkSettings(): AdapterNetworkSettingList {
    return {} as any; // TODO
  }

  override getNetworkTypeDefaultValues(): INetworkProtocolSettings {
    return {} as any; // TODO
  }

  override async fetchBalance() {
    return ''; // TODO
  }

  override async isAccountUsed() {
    return false; // TODO
  }

  override getHdWalletAccountFromMnemonicSeed(): IHdWalletAccount {
    return {} as any; // TODO
  }

  override async discoverLastUsedAccountIndex() {
    return 0; // TODO
  }

  override async constructAndSignTx() {
    return {} as any; // TODO
  }

  override async getTransactionByHash() {
    return {} as any; // TODO
  }

  override fetchPendingTransactions(): Promise<ITransaction[]> {
    return {} as any; // TODO
  }

  override async fetchTransactions() {
    return {} as any; // TODO
  }

  override spend() {
    return {} as any; // TODO
  }
}
