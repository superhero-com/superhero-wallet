/*
  eslint-disable
    camelcase,
    no-unused-vars,
*/

import { RouteLocationRaw } from 'vue-router';
import { TranslateResult } from 'vue-i18n';
import BigNumber from 'bignumber.js';
import { Store } from 'vuex';
import {
  ContractMethodsBase,
  Encoded,
  Node,
  Tag,
} from '@aeternity/aepp-sdk';
import type { CoinGeckoMarketResponse } from '../lib/CoinGecko';
import {
  AETERNITY_COIN_ID,
  ALLOWED_ICON_STATUSES,
  INPUT_MESSAGE_STATUSES,
  MULTISIG_CREATION_PHASES,
  POPUP_TYPES,
  TX_FUNCTIONS_MULTISIG,
  TX_FUNCTIONS,
  TX_RETURN_TYPES,
} from '../popup/utils';
import { RejectedByUserError } from '../lib/errors';

export * from './cordova';
export * from './router';
export * from './filter';
export * from './forms';

export type Dictionary<T = any> = Record<string, T>;

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
 * Allowed options that can be passed to our fetch utility functions
 */
export interface IRequestInitBodyParsed extends Omit<RequestInit, 'body'> {
  body?: object;
}

type GenericApiMethod<T = any> = (...args: any) => Promise<T>;

export type ResolveCallback = (...args: any) => void;
export type RejectCallback = (error?: RejectedByUserError) => void;

/**
 * Replacement for the regular `BigNumber` which was causing some issues
 * because of the private properties of the class.
 */
export type BigNumberPublic = PublicPart<BigNumber> | BigNumber;

export type Balance = BigNumberPublic;
export type BalanceRaw = string;

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
  privateKey: any;
  chainCode: any;
}

export type InputMessageStatus = ObjectValues<typeof INPUT_MESSAGE_STATUSES>;

/**
 * Input fields message prop type
 */
export interface IInputMessage {
  status?: InputMessageStatus
  text?: string
  hideMessage?: boolean
}

export type IInputMessageRaw = string | IInputMessage;

/**
 * Fungible tokens that are available in currently used network.
 */
export interface IToken {
  contractId: Encoded.ContractAddress | typeof AETERNITY_COIN_ID;
  contract_txi?: number;
  convertedBalance?: number; // Amount of the token that is owned
  decimals: number;
  event_supply?: number;
  extensions?: string[];
  holders?: number;
  image?: string;
  initial_supply?: number;
  name: string;
  symbol: string;
  text?: string; // TODO determine if we can remove this
  value?: string; // TODO copy of the contractId, maybe we should remove it
}

export interface ITokenResolved extends Partial<IToken> {
  amount?: number;
  isAe?: boolean;
  isPool?: boolean;
  isReceived?: boolean;
  symbol: string; // Ensure its present in the current interface
}

export type ITokenList = Record<string, IToken>

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

export type AccountKind = 'basic'; // TODO establish other possible values

/**
 * Account stored on the application store.
 */
export interface IAccount {
  address: Encoded.AccountAddress
  idx?: number
  name: string // .chain
  publicKey: Uint8Array
  secretKey: Uint8Array
  showed: boolean
  type: string
}

/**
 * Account fetched from the node with the use of `aeSdk.api.getAccountByPubkey`
 */
type AeternityAccountFetched = Awaited<ReturnType<InstanceType<typeof Node>['getAccountByPubkey']>>;

// TODO: remove this wrapper when all the amount moved to a bigint
export interface IAccountFetched extends Omit<AeternityAccountFetched, 'balance'> {
  balance: string;
}

export interface IAccountOverview extends Partial<Omit<IAccount, 'address'>> {
  // TODO: use a proper type for an address since it can be a url
  address?: Encoded.AccountAddress | string;
  url?: string;
  contractCreate?: boolean;
  aens?: boolean;
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

export interface INetworkBase {
  /**
   * Node backend URL
   */
  url: string;
  /**
   * Unique name provided by the user
   */
  name: string;
  middlewareUrl: string;
  /**
   * TODO: Replace with different way of differentiating the networks
   */
  networkId: string;
  compilerUrl: string;
  /**
   * Tipping backend URL
   */
  backendUrl: string;
  index?: number;
}

export interface INetwork extends INetworkBase {
  explorerUrl: string
  tipContractV1: Encoded.ContractAddress
  tipContractV2?: Encoded.ContractAddress
  multisigBackendUrl: string
}

export interface IPermission {
  address: boolean
  addressList: boolean,
  host: string
  messageSign: boolean
  name: string
  dailySpendLimit: boolean
  transactionSignFirstAskedOn: any
  transactionSignLimit: number
  transactionSignLimitLeft: number
}

export type NotificationStatus = 'CREATED' | 'PEEKED' | 'READ';

export interface INotification {
  wallet?: boolean
  senderName?: string
  receiverName?: string
  createdAt: string
  entityId?: string
  entityType?: string
  id?: number
  path?: RouteLocationRaw
  receiver?: string
  sender?: string
  sourceId?: string
  sourceType?: string
  status: NotificationStatus
  text?: string | TranslateResult
  type: string
  updatedAt?: string
  isSeedBackup?: boolean
  buttonLabel?: TranslateResult,
  title?: TranslateResult,
}

export interface INotificationSetting {
  text: TranslateResult
  checked: boolean
  type: string
}

export type CurrencyCode = 'usd' | 'eur' | 'aud' | 'brl' | 'cad' | 'chf' | 'cny' | 'czk' | 'dkk' | 'gbp' | 'hkd' | 'huf' | 'idr' | 'ils' | 'inr' | 'jpy' | 'krw' | 'mxn' | 'myr' | 'nok' | 'nzd' | 'php' | 'pln' | 'rub' | 'sek' | 'sgd' | 'thb' | 'try' | 'zar' | 'xau';

export interface ICurrency {
  name: string;
  code: CurrencyCode;
  symbol: string;
}

export type CurrencyRates = Record<CurrencyCode, number>;

export interface TxArguments {
  type: 'tuple' | 'list'
  value: any // TODO find type, this was not correct: (string | number | any[])
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
  type: string;
  version: number;
}
export interface IGAMetaTx {
  amount: string;
  fee: number;
  nonce: number;
  payload: string;
  recipientId: string;
  senderId: string;
  type: string;
  version: number;
}

export interface ITx {
  abiVersion?: number
  accountId?: Encoded.AccountAddress
  amount: number
  arguments: TxArguments[];
  callData?: Encoded.ContractBytearray;
  call_data?: string // TODO incoming data is parsed with the use of camelcaseDeep, but not always
  callerId: Encoded.AccountAddress
  code?: string
  commitmentId?: any
  contractId: Encoded.ContractAddress
  fee: number
  function?: TxFunction
  gaId?: string; // Generalized Account ID
  gas?: number
  gasPrice?: number
  gasUsed?: number
  log?: any[] // TODO find source
  name?: any
  nameFee?: number
  nameId?: any
  nameSalt?: string
  nonce?: number
  payerId?: string
  payload?: Encoded.Bytearray;
  pointers?: any;
  result?: string;
  return?: TxArguments;
  returnType?: typeof TX_RETURN_TYPES[number];
  recipientId?: string
  senderId?: string
  selectedTokenContractId?: string
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
  }
  VSN?: string;
}

export interface ITransaction {
  blockHeight?: number;
  claim?: any; // TODO find type
  hash: string;
  incomplete?: boolean;
  microIndex?: number;
  microTime?: number;
  pending: boolean;
  pendingTokenTx?: boolean;
  rawTx?: any; // TODO find type
  tipUrl?: string;
  transactionOwner?: Encoded.AccountAddress;
  tx: ITx;
  url?: string;
}

export interface IStoreTransactions {
  loaded: ITransaction[];
  nextPageUrl?: string;
}

export interface IDashboardTransaction extends ITransaction {
  direction?: 'received' | 'send'
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
  nextPageUrl?: string;
  pending: Record<string, ITransaction[]>;
  tipWithdrawnTransactions: ITransaction[];
}

/**
 * Browser popup window names
 */
export type IPopupType = typeof POPUP_TYPES[number];

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

export interface IName {
  autoExtend: boolean;
  createdAtHeight: number;
  expiresAt: number;
  hash: string;
  name: string;
  owner: string;
  pointers: Dictionary;
}

/**
 * Data fetched with the use of `aeSdk.api.getNameEntryByName` method.
 */
export interface INameEntryFetched {
  id: string;
  owner: string;
  pointers: { id: string; key: string }[];
  ttl: number;
}

/**
 * Middleware v1 autogenerated endpoints.
 * TODO: Update the list after migrating to v2.
 */
export interface IMiddleware {
  getActiveNames: GenericApiMethod;
  getActiveOracles: GenericApiMethod;
  getAllAuctions: GenericApiMethod;
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
  getNames: (address: string) => Promise<any>;
  getOracle: GenericApiMethod;
  getOracles: GenericApiMethod;
  getStatus: GenericApiMethod;
  getTxs: GenericApiMethod;
  getTx: (hash: string) => Promise<any>;
  getTxByIndex: GenericApiMethod;
  getTxCountById: GenericApiMethod;
  getTxsByDirection: GenericApiMethod;
  getTxsByScope: GenericApiMethod;
}

export interface IMiddlewareStatus {
  mdwAsyncTasks: Record<string, number>
  mdwGensPerMinute: number
  mdwHeight: number
  mdwRevision: string
  mdwSynced: boolean
  mdwSyncing: boolean
  mdwTxIndex: number
  mdwVersion: string
  nodeHeight: number
  nodeProgress: number
  nodeRevision: string
  nodeSyncing: boolean
  nodeVersion: string
}

export interface IPopupConfig {
  type: string;
  app: IAppData;
  action?: any;
  data?: string;
  message?: string;
  tx?: Partial<ITx>;
  resolve?: any;
  reject?: any;
  show?: boolean;
  txBase64?: Encoded.Transaction;
}

export interface IResponseChallenge {
  challenge: string
  payload: string
}

export interface IRespondChallenge {
  challenge: string
  signature: string
}

export interface IAuctionBid {
  accountId: string
  nameFee: BigNumber
}

export interface IAuction {
  bids: IAuctionBid[]
  expiration: number
}

export interface IActiveAuctionBid {
  accountId: string
  fee: number
  name: string
  nameFee: string
  nameId: string
  nameSalt: number
  nonce: number
  ttl: number
  type: string
  version: number
}

export interface IActiveAuction {
  expiration: number
  lastBid: IActiveAuctionBid
  name: string
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

export interface IKeyPair {
  publicKey: Encoded.AccountAddress;
  secretKey: string;
}

export interface IDefaultComposableOptions {
  /**
   * TODO: Temporary solution to avoid dependency circle
   */
  store: Store<any>
}

export type StatusIconType = typeof ALLOWED_ICON_STATUSES[number];

export interface TippingV1ContractApi extends ContractMethodsBase {
  unclaimed_for_url: (url: string) => string;
  tip: (recipientId: Encoded.AccountAddress, note: string) => void;
  retip: (tipId: number) => void;
}

export interface TippingV2ContractApi extends TippingV1ContractApi {
  tip_token: (
    recipientId: Encoded.AccountAddress,
    note: string,
    contractId: Encoded.ContractAddress,
    amount: string
  ) => Encoded.TxHash;
  retip_token: (
    id: number,
    contactId: Encoded.ContractAddress,
    amount: number
  ) => Encoded.TxHash;
}
