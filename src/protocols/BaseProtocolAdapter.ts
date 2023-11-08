import BigNumber from 'bignumber.js';
import type {
  AdapterNetworkSettingList,
  ICoin,
  IHdWalletAccount,
  INetworkProtocolSettings,
  IFetchTransactionResult,
  MarketData,
  NetworkTypeDefault,
  ITransaction,
  Protocol,
  NetworkType,
} from '@/types';
/**
 *  Represents common attributes and behavior of a protocol
 */
export abstract class BaseProtocolAdapter {
  abstract protocol: Protocol;

  abstract protocolName: string;

  abstract getAccountPrefix(): string;

  abstract getExplorer(): any;

  abstract getAmountPrecision(args?: any): number;

  abstract getCoinSymbol(getShort: boolean): string;

  abstract getUrlTokenKey(): string;

  abstract getCoinGeckoCoinId(): string;

  abstract getDefaultAssetContractId(): string;

  abstract getDefaultCoin(
    marketData: MarketData,
    convertedBalance?: number | BigNumber,
  ): ICoin;

  /**
   * Get settings used to generate network settings form for this protocol.
   */
  abstract getNetworkSettings(): AdapterNetworkSettingList;

  /**
   * This function allows to obtain data that will be passed as the default values
   * when setting up new networks. Then users can override them.
   */
  abstract getNetworkTypeDefaultValues(networkType: NetworkTypeDefault): INetworkProtocolSettings;

  abstract fetchBalance(address: string): Promise<string>;

  /**
   * Validates if the account address matches the protocol.
   */
  abstract isAccountAddressValid(address: string, networkType?: NetworkType): boolean;

  /**
   * Check whether the network has encountered this account.
   * @param address Account address
   */
  abstract isAccountUsed(address: string): Promise<boolean>;

  /**
   * Generate account from Mnemonic
   * @param seed 12 word seed array buffer
   * @param accountIndex Account Index in derivation path
   */
  abstract getHdWalletAccountFromMnemonicSeed(
    seed: Uint8Array,
    accountIndex: number,
  ): IHdWalletAccount;

  /**
   * Discover accounts that have been used in the past
   * @param seed 12 word seed array buffer
   * @returns index of the last account that has any history records (-1 means no accounts found)
   */
  abstract discoverLastUsedAccountIndex(seed: Uint8Array): Promise<number>;

  abstract constructAndSignTx(
    amount: number,
    recipient: string,
    options: Record<string, any>,
  ): Promise<any>;

  abstract getTransactionByHash(hash: string): Promise<any>

  abstract fetchPendingTransactions(
    address: string
  ): Promise<ITransaction[]>

  abstract fetchTransactions(
    address: string,
    nextPageParams: string | null,
  ): Promise<IFetchTransactionResult>;

  /**
   * Spend coin
   * @param options Protocol specific parameters
   */
  abstract spend(
    amount: number,
    recipient: string,
    options: Record<string, any>,
  ): Promise<{ hash: string }>;
}
