import BigNumber from 'bignumber.js';
import type {
  AccountAddress,
  AdapterNetworkSettingList,
  AssetContractId,
  INetworkProtocolSettings,
  ITransactionApiPaginationParams,
  ICoin,
  IFetchTransactionResult,
  IHdWalletAccount,
  IToken,
  ITokenBalance,
  ITransaction,
  ITransferResponse,
  MarketData,
  NetworkType,
  NetworkTypeDefault,
  Protocol,
  IAmountDecimalPlaces,
} from '@/types';
import { ProtocolExplorer } from '@/lib/ProtocolExplorer';

/**
 * Represents common attributes and behavior of a protocol
 */
export abstract class BaseProtocolAdapter {
  abstract protocol: Protocol;

  abstract protocolName: string;

  abstract protocolSymbol: string;

  abstract coinName: string;

  abstract coinSymbol: string;

  abstract coinContractId: AssetContractId;

  abstract coinPrecision: number;

  /**
   * Defines if the protocol supports fungible tokens (token contracts).
   */
  abstract hasTokensSupport: boolean;

  /**
   * Estimated time we need to wait for the middleware to sync it's state with the node.
   */
  abstract mdwToNodeApproxDelayTime: number;

  abstract getAccountPrefix(): string;

  abstract getExplorer(): ProtocolExplorer;

  abstract getAmountPrecision(args?: IAmountDecimalPlaces): number;

  abstract getUrlTokenKey(): string;

  abstract getCoinGeckoCoinId(): string;

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

  /**
   * Validates if the account address matches the protocol.
   */
  abstract isAccountAddressValid(address: AccountAddress, networkType?: NetworkType): boolean;

  /**
   * Check whether the network has encountered this account.
   * @param address Account address
   */
  abstract isAccountUsed(address: AccountAddress): Promise<boolean>;

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

  abstract fetchAvailableTokens(): Promise<IToken[] | null>;

  abstract fetchAccountTokenBalances(address: AccountAddress): Promise<ITokenBalance[] | null>;

  abstract transferToken(
    amount: number,
    recipient: string,
    contractId: AssetContractId,
    options: Record<string, any>,
  ): Promise<ITransferResponse | undefined>;

  abstract fetchTokenInfo(contractId: AssetContractId): Promise<IToken | undefined>;

  abstract fetchBalance(address: AccountAddress): Promise<string>;

  abstract fetchTransactionByHash(hash: string): Promise<any>;

  abstract fetchPendingTransactions(
    address: AccountAddress,
  ): Promise<ITransaction[]>;

  /**
   * Fetches all asset transactions (Both Coin AND Token) for an account.
   */
  abstract fetchAccountTransactions(
    address: AccountAddress,
    params?: ITransactionApiPaginationParams,
  ): Promise<IFetchTransactionResult>;

  /**
   * Fetches specified asset transactions (Coin OR Token) for an account.
   */
  abstract fetchAccountAssetTransactions(
    address: AccountAddress,
    assetContractId: AssetContractId,
    params?: ITransactionApiPaginationParams,
  ): Promise<IFetchTransactionResult>;

  /**
   * Spend coin
   * @param options Protocol specific parameters
   */
  abstract spend(
    amount: number,
    recipient: string,
    options: Record<string, any>,
  ): Promise<ITransferResponse>;

  abstract waitTransactionMined(hash: string): Promise<any>;
}
