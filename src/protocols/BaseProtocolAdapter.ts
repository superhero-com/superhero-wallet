import BigNumber from 'bignumber.js';
import type {
  AccountAddress,
  AdapterNetworkSettingList,
  AssetContractId,
  INetworkProtocolSettings,
  IPageableResponse,
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
  AssetAmount,
  IAccountRaw,
  IAccount,
} from '@/types';
import { ProtocolExplorer } from '@/lib/ProtocolExplorer';

/**
 * Represents common attributes and behavior of a protocol
 */
export abstract class BaseProtocolAdapter {
  abstract protocol: Protocol;

  abstract protocolName: string;

  abstract coinName: string;

  abstract coinSymbol: string;

  abstract coinContractId: AssetContractId;

  abstract coinPrecision: number;

  abstract coinGeckoCoinId: string;

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

  abstract getDefaultCoin(
    marketData?: MarketData,
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
   * Validates if the address or name encoding matches the protocol.
   */
    abstract isValidAddressOrNameEncoding(
      address: AccountAddress,
      networkType?: NetworkType,
    ): boolean;

  /**
   * Check whether the network has encountered this account.
   * @param address Account address
   */
  abstract isAccountUsed(address: AccountAddress): Promise<boolean>;

  /**
   * `getHdWalletAccountFromMnemonicSeed` memoization cache, keyed by seed
   * object identity (safe because `mnemonicSeed` is a Vue `computed` and so
   * keeps the same `Uint8Array` reference until the mnemonic actually
   * changes) and then by a string key of accountIndex plus any extra state
   * the protocol's derivation depends on (see
   * `getHdWalletDerivationCacheKeyExtras`).
   */
  private hdWalletAccountCache = new WeakMap<Uint8Array, Map<string, IHdWalletAccount>>();

  /**
   * Generate account from Mnemonic. Memoized: derivation is a pure function
   * of (seed, accountIndex, ...cache key extras), but re-deriving it is a
   * full BIP32 seed expansion + path derivation, and the `accounts` computed
   * (composables/accounts.ts) that calls this can recompute on every account
   * list read -- polling loops included. Protocols implement the actual
   * derivation in `deriveHdWalletAccountFromMnemonicSeed`.
   * @param seed 12 word seed array buffer
   * @param accountIndex Account Index in derivation path
   */
  getHdWalletAccountFromMnemonicSeed(
    seed: Uint8Array,
    accountIndex: number,
  ): IHdWalletAccount {
    const cacheKey = [accountIndex, ...this.getHdWalletDerivationCacheKeyExtras()].join(':');

    let accountsForSeed = this.hdWalletAccountCache.get(seed);
    if (!accountsForSeed) {
      accountsForSeed = new Map();
      this.hdWalletAccountCache.set(seed, accountsForSeed);
    }

    let account = accountsForSeed.get(cacheKey);
    if (!account) {
      account = this.deriveHdWalletAccountFromMnemonicSeed(seed, accountIndex);
      accountsForSeed.set(cacheKey, account);
    }
    return account;
  }

  protected abstract deriveHdWalletAccountFromMnemonicSeed(
    seed: Uint8Array,
    accountIndex: number,
  ): IHdWalletAccount;

  /**
   * Extra `getHdWalletAccountFromMnemonicSeed` cache-key components beyond
   * (seed, accountIndex). Override when derivation reads additional reactive
   * state, so a change in that state doesn't return a stale cached account --
   * e.g. Bitcoin/Dogecoin's address encoding depends on the active network
   * type (mainnet vs testnet), not just the seed and index.
   */
  // eslint-disable-next-line class-methods-use-this -- default no-op hook, overridden per protocol
  protected getHdWalletDerivationCacheKeyExtras(): string[] {
    return [];
  }

  abstract resolveAccountRaw (
    rawAccount: IAccountRaw,
    idx: number,
    globalIdx: number,
    seed?: Uint8Array
  ): IAccount | null;

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

  fetchAvailableTokens?(): Promise<IToken[] | null>;

  fetchAvailableTokensPage?(nextPageUrl?: string): Promise<IPageableResponse<IToken> | null>;

  fetchAvailableTokensSearchPage?(
    searchTerm: string,
    searchBy: 'name' | 'symbol',
    nextPageUrl?: string,
  ): Promise<IPageableResponse<IToken> | null>;

  fetchAccountTokenBalances?(address: AccountAddress): Promise<ITokenBalance[] | null>;

  transferToken?(
    amount: AssetAmount,
    recipient: string,
    contractId: AssetContractId,
    options: Record<string, any>,
  ): Promise<ITransferResponse | undefined>;

  transferPreparedTransaction?(transactionData: any): Promise<ITransferResponse | undefined>;

  async fetchTokenInfo?(contractId: AssetContractId): Promise<IToken | undefined>;

  abstract fetchBalance(address: AccountAddress): Promise<string>;

  abstract fetchTransactionByHash(
    hash: string,
    transactionOwner?: AccountAddress,
  ): Promise<ITransaction>;

  fetchPendingTransactions?(address: AccountAddress): Promise<ITransaction[]>;

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
