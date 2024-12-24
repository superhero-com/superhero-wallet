/* eslint-disable camelcase */

import { Component, CreateComponentPublicInstance } from 'vue';
import { RouteLocationRaw } from 'vue-router';
import { TranslateResult } from 'vue-i18n';
import BigNumber from 'bignumber.js';
import {
  AensName,
  Encoded,
  Node,
  Tag,
} from '@aeternity/aepp-sdk';
import type { Animation } from '@ionic/vue';

import {
  ACCOUNT_TYPES,
  ALLOWED_ICON_STATUSES,
  ASSET_TYPES,
  INPUT_MESSAGE_STATUSES,
  NOTIFICATION_TYPES,
  POPUP_ACTIONS,
  POPUP_METHODS,
  SESSION_METHODS,
  POPUP_TYPES,
  STORAGE_KEYS,
  TRANSFER_SEND_STEPS,
  CONNECT_PERMISSIONS,
} from '@/constants';
import type { CoinGeckoMarketResponse } from '@/lib/CoinGecko';
import type { RejectedByUserError } from '@/lib/errors';
import type { EthRpcSupportedMethods, IEthRpcMethodParameters } from '@/protocols/ethereum/types';
import {
  AE_CONTRACT_ID,
  MULTISIG_CREATION_PHASES,
  TX_FUNCTIONS,
  TX_FUNCTIONS_MULTISIG,
  TX_RETURN_TYPES,
} from '@/protocols/aeternity/config';
import { BTC_CONTRACT_ID } from '@/protocols/bitcoin/config';
import { ETH_CONTRACT_ID } from '@/protocols/ethereum/config';
import { Protocol } from './protocols';

export * from './filter';
export * from './networks';
export * from './protocols';
export * from './router';

export type Class<T> = new (...args: unknown[]) => T

export type Dictionary<T = any> = Record<string, T>;

/**
 * Makes selected properties optional.
 * @example `Optional<{ foo: string, bar: number }, 'foo'>`
 */
export type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;

export type Truthy<T> = T extends false | '' | 0 | null | undefined ? never : T;

/**
 * Convert `key: val` objects into union of values.
 */
export type ObjectValues<T> = T[keyof T];

/**
 * Generic that allows to pick only the public properties of a class.
 */
export type PublicPart<T> = { [K in keyof T]: T[K] };

/**
 * Makes the interface and all the child interfaces to be partial.
 */
export type PartialDeep<T> = T extends object ? {
  [P in keyof T]?: PartialDeep<T[P]>;
} : T;

/**
 * Useful when applying ref="..." to Vue Component instead of HTML element.
 * In this case in order to access the child component's element we need to use
 * `$el` property. Vue uses `any` for this property, but in most cases this is an HTML element.
 */
export interface ComponentRef extends CreateComponentPublicInstance {
  $el: HTMLElement;
}

/**
 * Allowed options that can be passed to our fetch utility functions
 */
export interface IRequestInitBodyParsed extends Omit<RequestInit, 'body'> {
  body?: object;
}

type GenericApiMethod<T = any, U extends unknown[] = any> = (...args: U) => Promise<T>;

export type ResolveCallback<T = any> = (returnValue?: T) => void;
export type RejectCallback = (error?: RejectedByUserError) => void;

/**
 * Replacement for the regular `BigNumber` which was causing some issues
 * because of the private properties of the class.
 */
export type BigNumberPublic = PublicPart<BigNumber> | BigNumber;

export type Balance = BigNumberPublic;
export type BalanceRaw = string;

/**
 * Each protocol has it's own address schema. This is only a generic placeholder.
 * TODO replace the value with only the `string`.
 */
export type AccountAddress = Encoded.AccountAddress | string;

export type NetworkId = string;

export interface IPageableResponse<T> {
  data: T[];
  next: string;
}

export interface IAppData {
  name?: string;
  href?: string;
  host: string;
  protocol?: string;
}

export interface IWallet {
  secretKey: any;
  chainCode: any;
}

export interface IHdWalletAccount {
  publicKey: Uint8Array;
  secretKey: Uint8Array;
  address: AccountAddress;
}

export type InputMessageStatus = ObjectValues<typeof INPUT_MESSAGE_STATUSES>;

/**
 * Input fields message prop type
 */
export interface IInputMessage {
  status?: InputMessageStatus;
  text?: string;
  hideMessage?: boolean;
}

export type IInputMessageRaw = string | IInputMessage;

export interface ITokenBalanceResponse {
  amount: number;
  blockHash: Encoded.MicroBlockHash;
  contractId: Encoded.ContractAddress;
  decimals: number; // precision
  height: number;
  tokenName: string;
  tokenSymbol: string;
  txHash: Encoded.TxHash;
  txIndex: number;
  txType: string;
}

export type AssetContractId =
  | Encoded.ContractAddress
  | typeof AE_CONTRACT_ID
  | typeof BTC_CONTRACT_ID
  | typeof ETH_CONTRACT_ID
  | string;

export interface ITokenSalePriceData {
  usd: number;
  eur: number;
  aud: number;
  brl: number;
  cad: number;
  chf: number;
  gbp: number;
  xau: number;
}

export interface ITokenSale {
  address: string;
  createdAt: string;
  creatorAddress: string;
  daoBalance: string;
  decimals: number;
  factoryAddress: string;
  id: number;
  marketCap: number;
  marketCapData: ITokenSalePriceData;
  name: string;
  networkId: string;
  ownerAddress: string;
  price: number;
  priceData: ITokenSalePriceData;
  saleAddress: string;
  sellPrice: number;
  sellPriceData: ITokenSalePriceData;
  symbol: string;
  totalSupply: number;
}

/**
 * Account's fungible token balance data
 */
export interface ITokenBalance extends Partial<ITokenSale>{
  address: AccountAddress;
  amount: number | string;
  contractId: AssetContractId;
  decimals?: number;
  /** Rounded amount of the token that is owned. Should not be used for precise calculations */
  convertedBalance?: number;
  protocol: Protocol;
  // Allow setting symbol and name so that we can extract custom tokens from balance data
  symbol?: string;
  name?: string;
  /**
   * This price is in coin per token
   */
  price: number;
}

/**
 * Fungible tokens that are available in currently used network.
 * TODO stop extending the interface with `ITokenBalance` because the token data
 *   should not hold any account related information like the balance.
 */
export interface IToken {
  amount?: number | string; // TODO consider removing data specific to an account
  contractId: AssetContractId;
  contractTxi?: number;
  convertedBalance?: number; // TODO consider removing data specific to an account
  /**
   * Precision required to calculate amounts.
   * It's optional for the token because some protocols does not provide this
   * when fetching the tokens data. Instead it is available for the token balance.
   */
  decimals?: number;
  extensions?: string[];
  holders?: number;
  image?: string;
  initialSupply?: number;
  name: string;
  protocol: Protocol;
  symbol: string;
  price: number;
}

export type TokenPair = Record<'token0' | 'token1', IToken | null>

export type IAssetType = ObjectValues<typeof ASSET_TYPES>;

/**
 * In most cases it's the result of firing one of the `TransactionResolvers`.
 */
export interface ITokenResolved extends Partial<IToken> {
  assetType?: IAssetType;
  isPool?: boolean;
  isReceived?: boolean;
  /**
   * Decides if the token should be treated as a coin (eg. Wrapped Aeternity).
   * For example when swapping the coin for any token we first need to
   * exchange the coin for wrapped coin and then swap this token for the desired one.
   * As the balance of wrapped coin tokens adds to the actual coin balance we are displaying
   * the coin instead ot the token and leave the token's contractId to allow of displaying
   * the swap route (see SwapRoute component).
   */
  isWrappedCoin?: boolean;
  name?: string;
  symbol?: string;
}

/**
 * Coins are specific to the network user can connect to. We assume each network
 * can have only one coin and many tokens.
 * TODO: Put the CoinGecko data in a separate property.
 */
export type ICoin = IToken & Omit<CoinGeckoMarketResponse, 'image'>;

/**
 * In general the "Asset" is any form of coin or fungible token we use in the app.
 */
export type IAsset = ICoin | IToken;

/**
 * Amount of the asset.
 * Converting it to number can cause precision issues.
 */
export type AssetAmount = string;

/**
 * Asset data with account related amounts and balances.
 * TODO should replace overused IToken in places where the amount and balance is needed.
 */
export type IAccountAsset = Partial<ITokenBalance> & IToken;

export type AssetList = Record<AssetContractId, IToken>;

export type AccountType = ObjectValues<typeof ACCOUNT_TYPES>;

/**
 * Simplified account structure stored it in the local storage
 * or fetched when discovering the accounts.
 */
export interface IAccountRaw {
  idx?: number;
  type: AccountType;
  isRestored: boolean;
  protocol: Protocol;
  address?: AccountAddress;
  publicKey?: string;
  privateKey?: Uint8Array; // This is used for the imported private key accounts
}

/**
 * Account stored on the application store.
 */
export interface IAccount extends IHdWalletAccount, Omit<IAccountRaw, 'publicKey'> {
  address: AccountAddress;
  globalIdx: number;
  idx: number;
}

/**
 * Account fetched from the node with the use of `aeSdk.api.getAccountByPubkey`
 */
type AeternityAccountFetched = Awaited<ReturnType<InstanceType<typeof Node>['getAccountByPubkey']>>;

// TODO: remove this wrapper when all the amount moved to a bigint
export interface IAccountFetched extends Omit<AeternityAccountFetched, 'balance'> {
  balance: string;
}

// TODO This interface is too loose. Empty object should not be valid.
export interface IAccountOverview extends Partial<Omit<IAccount, 'address'>> {
  // TODO: use a proper type for an address since it can be a url
  address?: AccountAddress;
  url?: string;
  contractCreate?: boolean;
  aens?: boolean;
  name?: string;
  label?: TranslateResult;
  wallet?: string; // Is the whole Wallet is being accessed by an Aepp
}

export interface IMultisigConsensus {
  confirmationsRequired: number;
  confirmedBy: AccountAddress[];
  expirationHeight: number;
  expired: boolean;
  proposedBy: AccountAddress;
  txHash?: string;
}

export interface IMultisigAccountResponse {
  contractId: Encoded.ContractAddress;
  createdAt: string; // Date
  /** Generalized Account used as the Multisig Account */
  gaAccountId: AccountAddress;
  height: number;
  id: number;
  signerId: Encoded.AccountAddress;
  updatedAt: string; // Date
  version: string; // X.X.X
}

/**
 * Our internal account data composed out of data collected from external sources.
 */
export interface IMultisigAccount extends IMultisigConsensus, IMultisigAccountResponse {
  balance: Balance;
  refusedBy?: AccountAddress[];
  nonce: number;
  signers: AccountAddress[];
  hasPendingTransaction: boolean;
  pending?: boolean;
}

export interface IRawMultisigAccount {
  multisigAccountCreationEncodedCallData?: Encoded.ContractBytearray;
  signedAttachTx?: Encoded.Transaction;
  rawTx?: Encoded.Transaction;
}

export type ConnectPermission = ObjectValues<typeof CONNECT_PERMISSIONS>;

export interface IPermission {
  address: boolean;
  addressList: boolean;
  host: string;
  messageSign: boolean;
  /** Dapp name */
  name: string;
  dailySpendLimit: boolean;
  transactionSignFirstAskedOn: string | null;
  /** Daily limit for transactions */
  transactionSignLimit: number;
  /** Amount spent during that day */
  transactionSignSpent: number;
}

/**
 * The `string` stands for the hostname, e.g.: `test.com`.
 */
export type PermissionRegistry = Record<string, IPermission>;

export type NotificationType = ObjectValues<typeof NOTIFICATION_TYPES>;

export type NotificationStatus = 'CREATED' | 'PEEKED' | 'READ';

export interface INotification {
  wallet?: boolean;
  createdAt: string;
  entityId?: string;
  entityType?: string;
  id?: number;
  path?: RouteLocationRaw;
  receiver?: Encoded.AccountAddress;
  sender?: Encoded.AccountAddress;
  sourceId?: string;
  sourceType?: string;
  status: NotificationStatus;
  text?: string;
  type: NotificationType;
  updatedAt?: string;
  isSeedBackup?: boolean;
  buttonLabel?: string;
  title?: string;
}

export type INotificationSettings = Record<NotificationType, boolean>;

export type CurrencyCode = 'usd' | 'eur' | 'aud' | 'brl' | 'cad' | 'chf' | 'cny' | 'czk' | 'dkk' | 'gbp' | 'hkd' | 'huf' | 'idr' | 'ils' | 'inr' | 'jpy' | 'krw' | 'mxn' | 'myr' | 'nok' | 'nzd' | 'php' | 'pln' | 'rub' | 'sek' | 'sgd' | 'thb' | 'try' | 'zar' | 'xau';

export interface ICurrency {
  name: string;
  code: CurrencyCode;
  symbol: string;
}

export type UrlStatus =
  | 'default'
  | 'blacklisted'
  | 'verified'
  | 'not-secure'
  | 'not-verified';

export type CurrencyRates = Record<Protocol, Record<CurrencyCode, number>>;

export interface TxArguments {
  type: 'any' | 'address' | 'contract' | 'tuple' | 'list' | 'bool' | 'string' | 'int';
  value: any; // TODO find type, this was not correct: (string | number | any[])
}

/**
 * TxFunction snake_case names coming directly from the API or ready to be sent.
 */
export type TxFunctionRaw = ObjectValues<typeof TX_FUNCTIONS>;

/**
 * TxFunction names parsed from snake_case to camelCase for the internal use.
 */
export type TxFunctionParsed = keyof typeof TX_FUNCTIONS;

export type TxFunctionMultisig = keyof typeof TX_FUNCTIONS_MULTISIG;

export type TxFunction = TxFunctionRaw | TxFunctionParsed | TxFunctionMultisig;

/**
 * String representation of the ITx.tag.
 */
export type TxType = keyof typeof Tag;

export interface IGAAttachTx {
  contractId: Encoded.ContractAddress;
  fee: number;
  gas: number;
  gasPrice: number;
  gasUsed: number;
  nonce: number;
  ownerId: string;
  returnType: string;
  type: Tag;
  version: number;
}

export interface IGAMetaTx {
  amount: string;
  fee: number;
  nonce: number;
  payload: string;
  recipientId: string;
  senderId: string;
  type: Tag;
  version: number;
}

export interface ITx {
  abiVersion?: number;
  accountId?: AccountAddress;
  aexnType?: 'aex9';
  amount: number;
  arguments?: TxArguments[];
  callData?: Encoded.ContractBytearray;
  call_data?: string; // TODO incoming data is parsed with the use of camelcaseDeep, but not always
  callerId?: AccountAddress;
  code?: Encoded.ContractBytearray;
  commitmentId?: any;
  contractId: AssetContractId; // TODO: make contractId optional, spendTx doesn't have it
  fee: number;
  function?: TxFunction;
  gaId?: string; // Generalized Account ID
  gas?: number;
  gasLimit?: number;
  gasPrice?: number;
  gasUsed?: number;
  internalEvents?: any[]; // TODO: type internal events
  log?: any[]; // TODO find source
  name?: any;
  nameFee?: number;
  nameId?: any;
  nameSalt?: string;
  nonce?: number;
  ownerId?: AccountAddress;
  payerId?: string;
  payload?: Encoded.Bytearray;
  pointers?: any;
  result?: string;
  return?: TxArguments;
  returnType?: typeof TX_RETURN_TYPES[number];
  recipientId?: string;
  senderId?: AccountAddress;
  selectedTokenContractId?: AssetContractId;
  tag?: Tag;
  /**
   * Middleware represents the `type` with different case than the aeSdk.
   * the `Tag.GaAttachTx` is `GAAttachTX`, `Tag.GaMetaTX` equal to `GAMetaTx`.
   * When comparing the `type` it is suggested to do case insensitive comparison.
   */
  type: TxType | string;
  tx?: {
    signatures: string[];
    tx: ITx | IGAAttachTx | IGAMetaTx;
  };
  VSN?: string;
  /** ETH contract call arguments */
  data?: string;
}

export interface ITransaction {
  blockHeight?: number;
  claim?: any; // TODO find type
  hash: Encoded.TxHash;
  incomplete?: boolean;
  microIndex?: number;
  microTime?: number;
  pending: boolean;
  protocol: Protocol;
  tipUrl?: string;
  /**
   * TODO "sent" field is used for removing local pending transaction - remove or rename it
   */
  sent?: boolean;
  /**
   * Custom property added to have the perspective from which we are looking at the transaction.
   * For example when we send some assets from one owned account to another
   * we are displaying the same transaction twice on the dashboard: as sent and received.
   * TODO maybe this can be removed and calculated on the component level
   */
  transactionOwner?: AccountAddress;
  tx: ITx;
  url?: string;
  isMultisig?: false; // TODO Consider merging the ITransaction with IActiveMultisigTransaction
}

export interface IDashboardTransaction extends ITransaction {
  direction?: 'received' | 'send';
}

export interface IActiveMultisigTransaction extends IMultisigAccount {
  totalConfirmations: number;
  hash: string;
  tx?: ITx;
  isMultisig: true;
  microTime?: number;
  protocol: Protocol; // Required to match `ITransaction`
}

export interface ITransactionOverview {
  sender: IAccountOverview | IAccount;
  recipient: IAccountOverview | IAccount;
  title: TranslateResult;
  function?: any;
}

export interface IDexContracts {
  router: AssetContractId[];
  /**
   * Wrapped AE token contractIds.
   * WAE token values mirrors the real AE value so can be exchanged 1:1 wit them.
   */
  wae: AssetContractId[];
}

export type DexFunctionType =
  | 'pool'
  | 'addLiquidity'
  | 'removeLiquidity'
  | 'swap'
  | 'allowance'
  | 'maxSpent'
  | 'minReceived';

export type TokenSaleFunctionType = 'buy' | 'sell';

export type ICommonTransaction = ITransaction | IActiveMultisigTransaction;

export interface IFeeItem {
  fee: BigNumberPublic;
  time: number; // time in seconds
  label: string;
  maxPriorityFee?: BigNumberPublic;
  maxFeePerGas?: BigNumberPublic;
}

/**
 * Browser popup window names
 */
export type PopupType = typeof POPUP_TYPES[number];

export type ITopHeader = Awaited<ReturnType<InstanceType<typeof Node>['getTopHeader']>>

/**
 * Todo replace ChainName with AensName within the app
 */
export type ChainName = AensName;

export interface IName {
  autoExtend: boolean;
  createdAtHeight: number;
  expiresAt: number;
  hash: string;
  name: AensName;
  owner: string;
  pending: Boolean;
  pointers: Dictionary;
}

/**
 * Middleware v1 autogenerated endpoints.
 * TODO: Update the list after migrating to v2.
 * @link https://testnet.aeternity.io/mdw/swagger/
 */
export interface IMiddleware {
  getAccountActivities: GenericApiMethod;
  getActiveNames: GenericApiMethod;
  getActiveOracles: GenericApiMethod;
  getAllAuctions: GenericApiMethod;
  getNamesAuctions: GenericApiMethod;
  getAllNames: GenericApiMethod;
  getBlockByHash: GenericApiMethod;
  getBlockByKbi: GenericApiMethod;
  getBlockByKbiAndMbi: GenericApiMethod;
  getBlocks: GenericApiMethod;
  getCurrentTxCount: GenericApiMethod;
  getInactiveOracles: GenericApiMethod;
  getName: GenericApiMethod;
  getNamePointees: GenericApiMethod;
  getNamePointers: GenericApiMethod;
  getNames: (
    options: { owned_by: Encoded.AccountAddress; state: string; limit: number }
  ) => Promise<any>;
  getOracle: GenericApiMethod;
  getOracles: GenericApiMethod;
  getStatus: GenericApiMethod;
  getTxs: GenericApiMethod<any, [{
    account?: string;
    contract?: string;
    direction?: 'forward' | 'backward';
    limit?: number;
    [key: string]: any;
  }]>;
  getTx: (hash: string) => Promise<ITransaction>;
  getTxByIndex: GenericApiMethod;
  getTxCountById: GenericApiMethod;
  getTxsByDirection: GenericApiMethod;
  getTxsByScope: GenericApiMethod;
}

export interface IMiddlewareStatus {
  mdwAsyncTasks: Record<string, number>;
  mdwGensPerMinute: number;
  mdwHeight: number;
  mdwRevision: string;
  mdwSynced: boolean;
  mdwSyncing: boolean;
  mdwTxIndex: number;
  mdwVersion: string;
  nodeHeight: number;
  nodeProgress: number;
  nodeRevision: string;
  nodeSyncing: boolean;
  nodeVersion: string;
}

export type PopupActionType = ObjectValues<typeof POPUP_ACTIONS>;
export type PopupMethod = ObjectValues<typeof POPUP_METHODS>;
export type SessionMethod = ObjectValues<typeof SESSION_METHODS>;
export type BackgroundMethod = PopupMethod | SessionMethod | EthRpcSupportedMethods;

export interface IPopupActions {
  resolve: ResolveCallback;
  reject: RejectCallback;
}

/**
 * This structure is also used in the `popup-handler.spec.js` file.
 * Whenever any change is done here remember to align the test cases.
 */
export interface IPopupData {
  action?: any;
  app?: IAppData;
  message?: string;
  type?: PopupActionType;
  tx?: ITx;
  txBase64?: Encoded.Transaction;
  aeppOrigin?: string;
  data?: string | Uint8Array;
}

/**
 * Popups are the modal windows opened inside of the browser window popup.
 * This set of properties relates only to `PopupType` modals.
 */
export interface IPopupProps extends IPopupActions, IPopupData {
  show?: boolean; // Decides if the modal window should be open
  fromAccount?: string;
  isSenderReplaced?: boolean;
  protocol?: Protocol;
  accountIdx?: number;
}

export interface IModalProps extends Partial<IPopupProps> {
  [key: string]: any; // Props defined on the component's level
}

export interface IBackgroundMessageData {
  target?: 'background' | 'offscreen';
  method?: BackgroundMethod;
  type?: PopupActionType;
  uuid?: string;
  params?: {
    aepp?: string | object;
    popupType?: PopupType;
    popupProps?: Partial<IPopupProps>;
    id?: string;
    rpcMethodParams?: IEthRpcMethodParameters;
  };
  payload?: any;
}

export interface IResponseChallenge {
  challenge: string;
  payload: string;
}

export interface IRespondChallenge {
  challenge: string;
  signature: string;
}

export interface IAuctionBid {
  accountId: string;
  nameFee: BigNumber;
}

export interface IAuction {
  bids: IAuctionBid[];
  expiration: number;
}

export interface INameAuctionBid {
  accountId: string;
  fee: number;
  name: string;
  nameFee: string;
  nameId: string;
  nameSalt: number;
  nonce: number;
  ttl: number;
  type: string;
  version: number;
}

export interface INameAuction {
  expiration: number;
  lastBid: INameAuctionBid;
  name: string;
}

export type IMultisigCreationPhase = keyof typeof MULTISIG_CREATION_PHASES | null;

export interface ICreateMultisigAccount {
  address?: Encoded.AccountAddress;
}

export interface IRawMultisigTx {
  id: number;
  hash: Encoded.TxHash;
  tx: Encoded.Transaction;
  createdAt: Date;
  updatedAt: Date;
}

export type StatusIconType = typeof ALLOWED_ICON_STATUSES[number];

export interface IFormModel {
  amount?: string;
  selectedAsset?: IAsset;
  address?: Encoded.AccountAddress;
  payload?: string;
}

export type TransferSendStep = ObjectValues<typeof TRANSFER_SEND_STEPS>;
export type TransferSendStepConfig = { component: Component; onSuccess: () => void };
export type TransferSendStepConfigRegistry = {
  [TRANSFER_SEND_STEPS.form]: TransferSendStepConfig;
  [TRANSFER_SEND_STEPS.review]: TransferSendStepConfig;
  [TRANSFER_SEND_STEPS.reviewTip]?: TransferSendStepConfig;
  [TRANSFER_SEND_STEPS.airGapSign]?: TransferSendStepConfig;
}

export interface TransferFormModel extends IFormModel {
  gasPrice?: number;
  gasUsed?: number;
  fee?: BigNumber;
  total?: number;
  invoiceContract?: any;
  invoiceId?: any;
  note?: string;
  maxPriorityFeePerGas?: string;
  maxFeePerGas?: string;
  payload: string;
}

export interface ITransferArgs {
  amount: string | BigNumberPublic;
  recipient: AccountAddress;
  selectedAsset: IAsset;
}

export type MarketData = Record<Protocol, CoinGeckoMarketResponse>;

export type StorageKey = ObjectValues<typeof STORAGE_KEYS>;

export type StorageKeysInput = string | string[];

export interface IWalletInfo {
  id: string;
  name: string;
  networkId: NetworkId;
  origin: any;
  type: any;
}

export interface IAddressNamePair {
  address: AccountAddress;
  name: ChainName;
}

/**
 * Different protocols use different methods to provide the ability to paginate the API
 * response lists. This interface stores every possible option.
 */
export interface ITransactionApiPaginationParams {
  /** Some APIs returns ready to use URL that allows to fetch next page results (eg.: Aeternity) */
  nextPageUrl?: string;
  /** Used by the Ethereum protocol */
  nextPageNum?: string;
  /** Used by the Bitcoin protocol to establish where the next page should start from */
  lastTxId?: string;
}

/**
 * TODO: Adapter's `fetchTransaction` method should return flat list of transaction without grouping
 */
export interface IFetchTransactionResult {
  regularTransactions: ITransaction[];
  pendingTransactions?: any[]; // TODO prepare types for PendingTransaction
  tipWithdrawnTransactions?: ITransaction[];
  paginationParams: ITransactionApiPaginationParams;
}
export interface IFormSelectOption {
  text: string;
  value: string | number;
}

export type Migration<T = any> = (restoredValue: T | any) => Promise<T>;

export interface IInvite {
  secretKey: object;
  createdAt: number;
}

export interface IHistoryItem {
  url: string;
  cleanPath?: string;
  title?: string;
  image?: string;
}

/**
 * Replacement for `AnimationBuilder` present in the ionic
 * which does not have the typings for the `opts`.
 */
export type IonAnimationBuilder = (
  baseEl: Element,
  opts: { enteringEl: Element; leavingEl: Element }
) => Animation;

export interface ITransferResponse {
  hash: string;
}

export interface IAmountDecimalPlaces {
  highPrecision?: boolean;
  amount?: number;
}

export interface IAddressBookEntry {
  name: string;
  address: AccountAddress;
  isBookmarked: boolean;
  protocol: Protocol;
}

export interface IAccountSelectorEntry extends IAddressBookEntry {
  isOwnAddress?: boolean;
  nameAddress?: Encoded.Name;
}

export interface IOtherSettings {
  isSeedBackedUp?: boolean;
  saveErrorLog?: boolean;
  isBiometricLoginEnabled?: boolean;
  secureLoginTimeout?: number;
}

/** [iv] + [encrypted message] */
export type IEncryptionResult = string;
