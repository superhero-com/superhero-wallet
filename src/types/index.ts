/* eslint-disable camelcase */

import { Component } from 'vue';
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
  ALLOWED_ICON_STATUSES,
  INPUT_MESSAGE_STATUSES,
  NOTIFICATION_TYPES,
  POPUP_ACTIONS,
  POPUP_TYPES,
  ASSET_TYPES,
  STORAGE_KEYS,
  TRANSFER_SEND_STEPS,
} from '@/constants';
import type { CoinGeckoMarketResponse } from '@/lib/CoinGecko';
import type { RejectedByUserError } from '@/lib/errors';
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
type PublicPart<T> = { [K in keyof T]: T[K] };

/**
 * Makes the interface and all the child interfaces to be partial.
 */
export type PartialDeep<T> = T extends object ? {
  [P in keyof T]?: PartialDeep<T[P]>;
} : T;

/**
 * Allowed options that can be passed to our fetch utility functions
 */
export interface IRequestInitBodyParsed extends Omit<RequestInit, 'body'> {
  body?: object;
}

type GenericApiMethod<T = any, U extends unknown[] = any> = (...args: U) => Promise<T>;

export type ResolveCallback = (...args: any) => void;
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
  name: string;
  url: string;
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
  | typeof ETH_CONTRACT_ID;

/**
 * Account's fungible token balance data
 */
export interface ITokenBalance {
  address: AccountAddress;
  amount: number | string;
  contractId: AssetContractId;
  /** Amount of the token that is owned */
  convertedBalance?: number;
  protocol: Protocol;
}

/**
 * Fungible tokens that are available in currently used network.
 */
export interface IToken {
  amount?: number | string; // TODO consider removing data specific to an account
  contractId: AssetContractId;
  contractTxi?: number;
  convertedBalance?: number; // TODO consider removing data specific to an account
  decimals: number;
  event_supply?: number;
  extensions?: string[];
  holders?: number;
  image?: string;
  initialSupply?: number;
  name: string;
  protocol: Protocol;
  symbol: string;
}

export type TokenPair = Record<'token0' | 'token1', IToken | null>

export type IAssetType = ObjectValues<typeof ASSET_TYPES>;

/**
 * In most cases it's the result of firing one of the `TransactionResolvers`.
 */
export interface ITokenResolved extends Partial<IToken> {
  isAe?: boolean;
  isPool?: boolean;
  isReceived?: boolean;
  assetType?: IAssetType;
  symbol: string; // Ensure its present in the current interface
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
 * Asset data with account related amounts and balances.
 * TODO should replace overused IToken in places where the amount and balance is needed.
 */
export type IAccountAsset = Partial<ITokenBalance> & IToken;

export type AssetList = Record<AssetContractId, IToken>;

export type AccountType = 'hd-wallet';

/**
 * Simplified account structure stored it in the local storage
 * or fetched when discovering the accounts.
 */
export interface IAccountRaw {
  type: AccountType;
  isRestored: boolean;
  protocol: Protocol;
}

/**
 * Account stored on the application store.
 */
export interface IAccount extends IHdWalletAccount, IAccountRaw {
  address: Encoded.AccountAddress;
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
  confirmedBy: Encoded.AccountAddress[];
  expirationHeight: number;
  expired: boolean;
  proposedBy: Encoded.AccountAddress;
  txHash?: string;
}

export interface IMultisigAccountResponse {
  contractId: Encoded.ContractAddress;
  createdAt: string; // Date
  gaAccountId: Encoded.AccountAddress; // Generalized Account used as the Multisig Account
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
  refusedBy?: Encoded.AccountAddress[];
  nonce: number;
  signers: Encoded.AccountAddress[];
  hasPendingTransaction: boolean;
  pending?: boolean;
}

export interface IRawMultisigAccount {
  multisigAccountCreationEncodedCallData?: Encoded.ContractBytearray;
  signedAttachTx?: Encoded.Transaction;
  rawTx?: Encoded.Transaction;
}

export interface IPermission {
  address: boolean;
  addressList: boolean;
  host: string;
  messageSign: boolean;
  name: string;
  dailySpendLimit: boolean;
  transactionSignFirstAskedOn: string | null;
  /**
   * Daily limit for transactions
   */
  transactionSignLimit: number;
  /**
   * Amount spent during that day
   */
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
  type: 'address' | 'contract' | 'tuple' | 'list' | 'bool' | 'string' | 'int';
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
  accountId?: Encoded.AccountAddress;
  aexnType?: 'aex9';
  amount: number;
  arguments: TxArguments[]; // TODO: make arguments optional, spendTx doesn't have them
  callData?: Encoded.ContractBytearray;
  call_data?: string; // TODO incoming data is parsed with the use of camelcaseDeep, but not always
  callerId: Encoded.AccountAddress; // TODO: make callerId optional, spendTx doesn't have it
  code?: Encoded.ContractBytearray;
  commitmentId?: any;
  contractId: Encoded.ContractAddress; // TODO: make contractId optional, spendTx doesn't have it
  fee: number;
  function?: TxFunction;
  gaId?: string; // Generalized Account ID
  gas?: number;
  gasPrice?: number;
  gasUsed?: number;
  log?: any[]; // TODO find source
  name?: any;
  nameFee?: number;
  nameId?: any;
  nameSalt?: string;
  nonce?: number;
  ownerId?: Encoded.AccountAddress;
  payerId?: string;
  payload?: Encoded.Bytearray;
  pointers?: any;
  result?: string;
  return?: TxArguments;
  returnType?: typeof TX_RETURN_TYPES[number];
  recipientId?: string;
  senderId?: Encoded.AccountAddress;
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
}

export interface ITransaction {
  blockHeight?: number;
  claim?: any; // TODO find type
  hash: Encoded.TxHash;
  incomplete?: boolean;
  microIndex?: number;
  microTime?: number;
  pending: boolean;
  pendingTokenTx?: boolean;
  protocol?: Protocol;
  rawTx?: any; // TODO find type
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
  transactionOwner?: Encoded.AccountAddress;
  tx: ITx;
  type?: string;
  url?: string;
}

export interface IDashboardTransaction extends ITransaction {
  direction?: 'received' | 'send';
}

export interface IActiveMultisigTransaction extends IMultisigAccount {
  totalConfirmations: number;
  hash?: string;
  tx?: ITx;
  isMultisigTransaction: boolean;
  microTime?: number;
}

export interface ITransactionOverview {
  sender: IAccountOverview | IAccount;
  recipient: IAccountOverview | IAccount;
  title: TranslateResult;
  function?: any;
}

export interface IDexContracts {
  router: Encoded.ContractAddress[];
  wae: Encoded.ContractAddress[];
}

export type DexFunctionType =
  | 'pool'
  | 'addLiquidity'
  | 'removeLiquidity'
  | 'swap'
  | 'allowance'
  | 'maxSpent'
  | 'minReceived';

export type ICommonTransaction = ITransaction | IActiveMultisigTransaction

export type ITransactionsState = {
  loaded: ITransaction[];
  nextPageUrl: string | null;
  localPendingTransaction: ITransaction | null;
  tipWithdrawnTransactions: ITransaction[];
}

export type IAccountTransactionsState = Record<string, ITransactionsState>

/**
 * Browser popup window names
 */
export type PopupType = typeof POPUP_TYPES[number];

export interface ITopHeader {
  hash: string;
  height: number;
  pofHash?: string;
  prevHash: string;
  prevKeyHash: string;
  signature?: string;
  stateHash: string;
  time: number;
  txsHash?: string;
  version: number;
}

export type ISignMessage = (m: any) => Promise<any>

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
  pointers: Dictionary;
}

/**
 * Middleware v1 autogenerated endpoints.
 * TODO: Update the list after migrating to v2.
 * @link https://testnet.aeternity.io/mdw/swagger/
 */
export interface IMiddleware {
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
  getTx: (hash: string) => Promise<any>;
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
}

/**
 * Popups are the modal windows opened inside of the browser window popup.
 * This set of properties relates only to `PopupType` modals.
 */
export interface IPopupProps extends IPopupActions, IPopupData {
  show?: boolean; // Decides if the modal window should be open
}

export interface IModalProps extends Partial<IPopupProps> {
  [key: string]: any; // Props defined on the component's level
}

export interface TokenProps {
  contractId?: string;
  tokenPairs?: any; // TODO: replace any with TokenPair & resolve issues
  tokenData?: any; // TODO: replace any with IToken & resolve issues
  tokens?: IToken[];
  isMultisig?: boolean;
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

export interface IActiveAuctionBid {
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

export interface IActiveAuction {
  expiration: number;
  lastBid: IActiveAuctionBid;
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
}

export interface TransferFormModel extends IFormModel {
  fee?: BigNumber;
  total?: number;
  invoiceContract?: any;
  invoiceId?: any;
  note?: string;
  maxPriorityFeePerGas?: string;
  maxFeePerGas?: string;
  payload: string;
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
  address: Encoded.AccountAddress;
  name: ChainName;
}

export interface IFetchTransactionResult {
  regularTransactions: ITransaction[];
  pendingTransactions?: any[]; // TODO prepare types for PendingTransaction
  tipWithdrawnTransactions?: ITransaction[];
  nextPageParams: string | null;
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

/**
 * Ionic lifecycle events do not trigger on components that are not tied to a route.
 * So we pass a status prop to the component to watch for the lifecycle events manually.
 */
export type IonicLifecycleStatus = 'willEnter' | 'didEnter' | 'willLeave' | 'didLeave' | null;

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
