/*
  eslint-disable
    camelcase,
    no-unused-vars,
*/

import { RawLocation } from 'vue-router';
import { LocaleMessages, TranslateResult } from 'vue-i18n';
import BigNumber from 'bignumber.js';
import { Store } from 'vuex';
import {
  POPUP_TYPES,
  INPUT_MESSAGE_STATUSES,
  MULTISIG_CREATION_PHASES,
  TX_FUNCTIONS,
  FUNCTION_TYPE_MULTISIG,
} from '../popup/utils';

export * from './cordova';
export * from './router';
export * from './filter';
export * from './forms';

export type Dictionary<T = any> = Record<string, T>;

/**
 * Convert `key: val` objects into union of values.
 */
export type ObjectValues<T> = T[keyof T];

/**
 * Generic that allows to pick only the public properties of a class.
 */
type PublicPart<T> = {[K in keyof T]: T[K]};

/**
 * Allowed options that can be passed to our fetch utility functions
 */
export interface IRequestInitBodyParsed extends Omit<RequestInit, 'body'> {
  body?: object;
}

type GenericApiMethod<T = any> = (...args: any) => Promise<T>;

export type ResolveRejectCallback = (...args: any) => void;

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

export interface IToken {
  contractId: string
  convertedBalance?: number
  decimals: number
  id?: string // Only for the Aeternity coin
  name: string
  symbol: string,
  extension?: string[]
}

export interface ITokenResolved extends Partial<IToken> {
  amount?: number
  isAe?: boolean
  isPool?: boolean
  isReceived?: boolean
}

export type ITokenList = Record<string, IToken>

export interface IAsset {
  ath: number
  ath_change_percentage: number
  ath_date: string
  atl: number
  atl_change_percentage: number
  atl_date: string
  balanceCurrency: number
  circulating_supply: number
  contractId: string
  convertedBalance: Balance;
  current_price: number
  decimals: number
  fully_diluted_valuation: any
  high_24h: number
  id: string
  image: string
  last_updated: string
  low_24h: number
  market_cap: number
  market_cap_change_24h: number
  market_cap_change_percentage_24h: number
  market_cap_rank: number
  max_supply: any
  name: string
  price_change_24h: number
  price_change_percentage_24h: number
  roi: object
  symbol: string
  total_supply: number
  total_volume: number
}

export type AccountKind = 'basic'; // TODO establish other possible values

/**
 * Account stored on the application store.
 */
export interface IAccount {
  address: string
  idx?: number
  name: string // .chain
  publicKey: Uint8Array
  secretKey: Uint8Array
  showed: boolean
  type: string
}

/**
 * Account fetched from the node with the use of `sdk.api.getAccountByPubkey`
 */
export interface IAccountFetched {
  balance: string;
  id: string; // ak_* hash
  kind: AccountKind;
  nonce: number;
  payable: boolean;
}

export interface IAccountLabeled extends Partial<IAccount> {
  url?: string
  label?: TranslateResult
}

export interface IMultisigConsensus {
  confirmationsRequired: number;
  confirmedBy: string[];
  expirationHeight: number;
  expired: boolean;
  proposedBy: string;
  txHash?: string;
}

export interface IMultisigAccountResponse {
  contractId: string;
  createdAt: string; // Date
  gaAccountId: string; // Generalized Account used as the Multisig Account
  height: number;
  id: number;
  signerId: string;
  updatedAt: string; // Date
  version: string; // X.X.X
}

/**
 * Our internal account data composed out of data collected from external sources.
 */
export interface IMultisigAccount extends IMultisigConsensus, IMultisigAccountResponse {
  balance: Balance;
  refusedBy?: string[];
  nonce: number;
  signers: string[];
  hasPendingTransaction: boolean;
  pending?: boolean;
}

export interface IRawMultisigAccount {
  multisigAccountCreationEncodedCallData?: string;
  signedAttachTx?: string;
  rawTx?: string;
}

export interface INetworkBase {
  url: string
  name: string
  middlewareUrl: string
  compilerUrl: string
  backendUrl: string
  index?: number
}

export interface INetwork extends INetworkBase {
  explorerUrl: string
  networkId: string
  tipContractV1: string
  tipContractV2?: string
  multisigBackendUrl: string
}

export interface IPermission {
  address: boolean
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
  path?: RawLocation
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

export interface ITxArguments {
  type: 'tuple' | 'list'
  value: any // TODO find type, this was not correct: (string | number | any[])
}

/**
 * TxFunction names coming directly from the API or ready to be sent.
 */
export type TxFunctionRaw = ObjectValues<typeof TX_FUNCTIONS>;

/**
 * TxFunctions used internally by the app.
 */
export type TxFunctionParsed = keyof typeof TX_FUNCTIONS;

export type TxFunction = TxFunctionRaw | TxFunctionParsed;

export type TxType =
  | 'SpendTx'
  | 'ContractCreateTx'
  | 'ContractCallTx'
  | 'NameBidTx'
  | 'NamePreclaimTx'
  | 'NameClaimTx'
  | 'NameUpdateTx'
  | 'NameTransferTx'
  | 'NameRevokeTx'
  | 'OracleRegisterTx'
  | 'OracleExtendTx'
  | 'OraclePostQueryTx'
  | 'OracleRespondTx'
  | 'ChannelCloseSoloTx'
  | 'ChannelSlashTx'
  | 'ChannelSettleTx'
  | 'ChannelSnapshotSoloTx'
  | 'PayingForTx'
  | 'GAAttachTx'
  | 'GAMetaTx';

export interface IGAAttachTx {
  contractId: string;
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
  abiVersion: number
  accountId?: string
  amount: number
  arguments: ITxArguments[]
  callData?: string // TODO find source
  call_data?: string // TODO incoming data is parsed with the use of camelcaseDeep, but not always
  callerId: string
  code: string
  commitmentId: any
  contractId: string
  fee: number
  function?: TxFunction
  gaId?: string; // Generalized Account ID
  gas: number
  gasPrice: number
  gasUsed: number
  log?: any[] // TODO find source
  name: any
  nameFee: number
  nameId: any
  nameSalt: string
  nonce: number
  payerId?: string
  payload?: string
  pointers: any
  result: string;
  return: ITxArguments
  returnType: string
  recipientId?: string
  senderId?: string
  selectedTokenContractId?: string
  tag?: string; // Allows to establish the transaction type
  type: TxType; // Custom property we add after unpacking the Tx
  tx?: {
    signatures: string[];
    tx: ITx | IGAAttachTx | IGAMetaTx;
  }
  VSN: string;
}

export interface ITransaction {
  blockHeight: number;
  claim: any; // TODO find type
  hash: string;
  incomplete?: boolean;
  microIndex: number;
  microTime: number;
  pending: boolean; // There are cases that not only the IPendingTransaction can be pending
  rawTx?: any; // TODO find type
  tipUrl?: string;
  transactionOwner?: string;
  tx: ITx;
  url?: string;
}

export interface IDashboardTransaction extends ITransaction {
  direction?: 'received' | 'send'
}

export type PendingTransactionType = 'spend' | 'spendToken';

export interface IPendingTransaction {
  hash: string;
  type?: PendingTransactionType;
  recipient?: string;
  incomplete?: boolean;
  pending: true;
  pendingTokenTx?: boolean;
  tipUrl?: string;
  tx: Partial<ITx>;
}

export interface IAccountOverView extends Partial<IAccount> {
  url?: string;
  contractCreate?: boolean;
  aens?: boolean;
  label: TranslateResult;
}

export interface ITransactionOverview {
  sender: IAccountOverView | IAccount;
  recipient: IAccountOverView | IAccount;
  title: TranslateResult;
  function?: any;
}

export interface IDexContracts {
  router: string[];
  wae: string[];
}

/**
 * Browser popup window names
 */
export type IPopupType = typeof POPUP_TYPES[number];

export interface ITopHeader {
  hash: string
  height: number
  pofHash: string
  prevHash: string
  prevKeyHash: string
  signature: string
  stateHash: string
  time: number
  txsHash: string
  version: number
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
 * Data fetched with the use of `sdk.api.getNameEntryByName` method.
 */
export interface INameEntryFetched {
  id: string;
  owner: string;
  pointers: { id: string; key: string }[];
  ttl: number;
}

/**
 * Temporary typing for the SDK used in the app.
 * TODO remove after migrating to SDK v12
 */
export interface ISdk {
  addNode: (name: string, node: any, select: boolean) => void;
  addRpcClient: (connection: any) => any;
  Ae: Dictionary;
  aensClaim: (name: string, salt: string, options?: any) => Promise<any>;
  aensPreclaim: (name: string) => Promise<any>;
  aensQuery: (name: string) => Promise<any>;
  api: Record<string, GenericApiMethod>;
  balance: (address: string) => Promise<number>;
  compilerApi: Record<string, (...args: any[]) => Promise<any>>;
  getAccount: (publicKey: any) => Promise<any>
  gaAttachTx: (options: {
    ownerId: any
    code: any
    callData: any
    authFun: any
    gas: any
    options: { innerTx: boolean }
  }) => Promise<any>
  getContractInstance: (o: any) => Promise<any>
  getContractByteCode: (contractId: string) => Promise<{ bytecode: any }>
  getNetworkId: () => string
  payForTransaction: (
    rawTx: string,
    options: {
      waitMined: boolean;
      modal: boolean;
      innerTx?: boolean
    }
  ) => Promise<{ hash: string, rawTx: string }>;
  payingForTx(arg0: any): any;
  poll: (txHash: string, options?: any) => any;
  pool: Map<string, any>;
  shareWalletInfo: (c: any) => any;
  signTransaction: (t: any, o: any) => Promise<any>
  signMessage: ISignMessage
  send: (
    tx: any,
    options?: {
      innerTx?: boolean,
      onAccount: string,
      authData?: any,
    }
  ) => Promise<ITransaction>
  sendTransaction: (t: any, o: any) => Promise<any>
  selectedNode: any
  spend: (a: any, r: any, o: any) => Promise<any>
  spendTx: (a: any) => Promise<any>
  address: () => Promise<string>
  aensBid: (name: string, aettos: any) => Promise<any>
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
  getNameById: GenericApiMethod;
  getNamePointees: GenericApiMethod;
  getNamePointers: GenericApiMethod;
  getNamesOwnedBy: (address: string) => Promise<any>;
  getOracle: GenericApiMethod;
  getOracles: GenericApiMethod;
  getStatus: GenericApiMethod;
  getTxByAccount: GenericApiMethod;
  getTxByHash: (hash: string) => Promise<any>;
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
  transaction?: Partial<ITx>;
  resolve?: any;
  reject?: any;
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

export type IMultisigFunctionTypes = keyof typeof FUNCTION_TYPE_MULTISIG;

export interface ICreateMultisigAccount {
  address: string;
}

export interface IActiveMultisigTx extends IMultisigAccount {
  totalConfirmations: number;
  hash?: string;
  tx?: ITx;
  isMultisigTransaction: boolean;
}

export interface IRawMultisigTx {
  id: number
  hash: string
  tx: string
  createdAt: Date
  updatedAt: Date
}

export interface IKeyPair {
  publicKey: string;
  secretKey: string;
}

export interface ILabel {
  text: string | LocaleMessages | TranslateResult,
  customPending?: string | LocaleMessages | TranslateResult
  hasComma?: boolean;
}

export interface IDefaultComposableOptions {
  /**
   * TODO: Temporary solution to avoid dependency circle
   */
  store: Store<any>
}

export type StatusIconType =
  | 'critical'
  | 'alert'
  | 'warning'
  | 'info'
  | 'success'
  | 'not-secure'
  | 'help';
