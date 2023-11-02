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
    return undefined; // TODO
  }

  override getUrlTokenKey() {
    return ''; // TODO
  }

  override getDefaultAssetContractId() {
    return ''; // TODO
  }

  override getDefaultCoin(): ICoin {
    return {} as any; // TODO
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
