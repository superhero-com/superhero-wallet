/* eslint-disable class-methods-use-this */

import { PROTOCOLS } from '@/constants';
import type {
  AdapterNetworkSettingList,
  IAccount,
  ICoin,
  IFetchTransactionResult,
  INetworkProtocolSettings,
  IToken,
  ITokenBalance,
  ITransaction,
  ITransferResponse,
  MarketData,
} from '@/types';
import { BaseProtocolAdapter } from '@/protocols/BaseProtocolAdapter';
import {
  SOL_COIN_PRECISION,
  SOL_COIN_SYMBOL,
  SOL_COINGECKO_COIN_ID,
  SOL_CONTRACT_ID,
  SOL_PROTOCOL_NAME,
} from '@/protocols/solana/config';

export class SolanaAdapter extends BaseProtocolAdapter {
  override protocol = PROTOCOLS.solana;

  override protocolName = SOL_PROTOCOL_NAME;

  override coinName = SOL_PROTOCOL_NAME;

  override coinSymbol = SOL_COIN_SYMBOL;

  override coinContractId = SOL_CONTRACT_ID;

  override coinPrecision = SOL_COIN_PRECISION;

  override coinGeckoCoinId = SOL_COINGECKO_COIN_ID;

  override hasTokensSupport = true;

  override mdwToNodeApproxDelayTime = 0; // TODO

  private networkSettings: AdapterNetworkSettingList = [
    // TODO
  ];

  override getAccountPrefix() {
    return ''; // TODO
  }

  override getAmountPrecision(): number {
    return 0; // TODO
  }

  override getExplorer() {
    return {} as any; // TODO
  }

  override getUrlTokenKey() {
    return SOL_CONTRACT_ID;
  }

  override getDefaultCoin(
    marketData?: MarketData,
    convertedBalance?: number,
  ): ICoin {
    return {
      ...(marketData?.[PROTOCOLS.solana]! || {} as MarketData),
      protocol: PROTOCOLS.solana,
      contractId: this.coinContractId,
      symbol: this.coinSymbol,
      decimals: this.coinPrecision,
      name: this.coinName,
      convertedBalance,
    };
  }

  override getNetworkSettings() {
    return this.networkSettings;
  }

  override getNetworkTypeDefaultValues(): INetworkProtocolSettings {
    return {} as any; // TODO
  }

  override async fetchBalance(): Promise<string> {
    return '0'; // TODO
  }

  override isAccountAddressValid() {
    return false; // TODO
  }

  override isValidAddressOrNameEncoding() {
    return false; // TODO
  }

  override async isAccountUsed(): Promise<boolean> {
    return false; // TODO
  }

  override getHdWalletAccountFromMnemonicSeed() {
    return {} as any; // TODO
  }

  override resolveAccountRaw(): IAccount | null {
    return null; // TODO
  }

  override async discoverLastUsedAccountIndex(): Promise<number> {
    return 0; // TODO
  }

  override async fetchAvailableTokens(): Promise<IToken[] | null> {
    return []; // TODO
  }

  override async fetchAccountTokenBalances(): Promise<ITokenBalance[] | null> {
    return []; // TODO
  }

  override async fetchTokenInfo(): Promise<IToken | undefined> {
    return undefined; // TODO
  }

  override async transferPreparedTransaction(): Promise<ITransferResponse> {
    return {} as any; // TODO
  }

  override async transferToken(): Promise<ITransferResponse> {
    return {} as any; // TODO
  }

  override async fetchTransactionByHash(): Promise<ITransaction> {
    return {} as any; // TODO
  }

  override async fetchAccountTransactions(): Promise<IFetchTransactionResult> {
    return {
      regularTransactions: [], // TODO
      paginationParams: {}, // TODO
    };
  }

  override async fetchAccountAssetTransactions(): Promise<IFetchTransactionResult> {
    return {
      regularTransactions: [], // TODO
      paginationParams: {}, // TODO
    };
  }

  override async constructAndSignTx(): Promise<any> {
    return {} as any; // TODO
  }

  override async spend(): Promise<ITransferResponse> {
    return {} as any; // TODO
  }

  override async waitTransactionMined(): Promise<any> {
    return null; // TODO
  }
}
