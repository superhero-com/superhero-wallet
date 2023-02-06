/*
  eslint-disable
    camelcase,
    no-unused-vars,
*/

import { RawLocation } from 'vue-router';
import { TranslateResult } from 'vue-i18n';
import BigNumber from 'bignumber.js';
import {
  POPUP_TYPES,
  INPUT_MESSAGE_STATUSES,
  MULTISIG_CREATION_STEPS,
  TX_FUNCTIONS,
} from '../popup/utils';

export * from './cordova';
export * from './router';
export * from './filter';

/**
 * Convert `key: val` objects into union of values.
 */
export type ObjectValues<T> = T[keyof T];

export interface IAppData {
  name: string
  url: string
  host: string
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
  convertedBalance: typeof BigNumber
  current_price: number
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
  decimals: number,
}

export interface IAccount {
  address: string
  idx?: number
  name: string // .chain
  publicKey: Uint8Array
  secretKey: Uint8Array
  showed: boolean
  type: string
}

export interface IAccountLabeled extends Partial<IAccount> {
  url?: string
  label?: TranslateResult
}

export interface IMultisigAccountBase {
  contractId: string
  multisigAccountId: string
}

export interface IMultisigAccount extends IMultisigAccountBase {
  signerId: string
  height: number
  createdAt: string
  updatedAt: string
  balance?: string
  confirmedBy: string[]
  expirationHeight: number
  confirmationsRequired: number
  txHash: string
  nonce: number
  signers: string[]
  version: string
  hasConsensus: boolean,
  address: string,
  gaAccountId?: string,
  consensusLabel?: string
}

export interface INetwork {
  backendUrl: string
  compilerUrl: string
  explorerUrl: string
  middlewareUrl: string
  name: string
  networkId: string
  tipContractV1: string
  tipContractV2?: string
  multisigBackendUrl: string
  url: string
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

export interface ICurrency {
  name: string
  code: string
  symbol: string
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

export type TransactionType =
  | 'SpendTx'
  | 'ContractCreateTx'
  | 'ContractCallTx'
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
  | 'ChannelSnapshotSoloTx';

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
  gas: number
  gasPrice: number
  gasUsed: number
  log?: any[] // TODO find source
  name: any
  nameFee: number
  nameId: any
  nameSalt: string
  nonce: number
  payload?: string
  pointers: any
  result: string,
  return: ITxArguments
  returnType: string
  recipientId?: string
  senderId?: string
  selectedTokenContractId?: string
  type: TransactionType
}

export interface ITransaction {
  blockHeight: number;
  hash: string,
  microIndex: number,
  microTime: number,
  claim: any, // TODO find type
  incomplete: any // TODO find type
  pending: any // TODO find type
  tx: ITx
}

export interface IPendingTransaction {
  hash: string,
  amount: number | string,
  type?: string,
  recipient?: string,
  pendingTokenTx?: boolean,
  tipUrl?: string,
  tx: Partial<ITx>
}

export interface IAccountOverView extends Partial<IAccount> {
  url?: string,
  contractCreate?: boolean,
  aens?: boolean,
  label: TranslateResult,
}

export interface ITransactionOverview {
  sender: IAccountOverView | IAccount,
  recipient: IAccountOverView | IAccount,
  title: TranslateResult,
  function?: any,
}

export interface IDexContracts {
  router: string[],
  wae: string[],
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

/**
 * Temporary typing for the SDK used in the app.
 * TODO remove after migrating to SDK v12
 */
export type ISignMessage = (m: any) => Promise<any>

export interface ISdk {
  api: Record<string, (a?: string) => any>
  compilerApi: Record<string, (...args: any[]) => Promise<any>>
  Ae: Record<string, any>
  pool: Map<string, any>
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
  payForTransaction: (rawTx: any, arg1: { waitMined: boolean; modal: boolean; }) => Promise<any>
  signTransaction: (t: any, o: any) => Promise<any>
  signMessage: ISignMessage
  send: (
    tx: any,
    arg1: {
      innerTx?: boolean,
      onAccount: any,
      authData?: any,
    }
  ) => Promise<{ rawTx: any; }>
  sendTransaction: (t: any, o: any) => Promise<any>
  spend: (a: any, r: any, o: any) => Promise<any>
  spendTx: (a: any) => Promise<any>
  address: () => Promise<string>
  aensBid: (name: string, aettos: any) => Promise<any>
  balance: (address: string) => Promise<number>
}

/**
 * Middleware autogenerated endpoints.
 */
export interface IMiddlewareClient {
  [key: string]: (p: any) => Promise<any>
}

/**
 * Middleware methods added for the use by the wallet
 */
export interface IMiddlewareCustomMethods {
  fetchByPath: (p: string) => Promise<any>
}

export interface IMiddleware extends IMiddlewareClient,
  IMiddlewareCustomMethods {
}

export interface IMiddlewareStatus {
  mdw_async_tasks: Record<string, number>
  mdw_gens_per_minute: number
  mdw_height: number
  mdw_revision: string
  mdw_synced: boolean
  mdw_syncing: boolean
  mdw_tx_index: number
  mdw_version: string
  node_height: number
  node_progress: number
  node_revision: string
  node_syncing: boolean
  node_version: string
}

export interface IName {
  autoExtend: boolean
  createdAtHeight: number
  expiresAt: number
  hash: string
  name: string
  owner: string
  pointers: Record<string, any>
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

export type IMultisigCreationStep = keyof typeof MULTISIG_CREATION_STEPS | null;

export interface ICreateMultisigAccount {
  address: string
}

export interface IActiveMultisigTx {
  totalConfirmations: number
  confirmationsRequired: number
  confirmedBy: string[]
  hasConsensus: boolean
  signers: string[],
  hash?: string
  tx?: ITx
  isMultisigTransaction: boolean
}

export interface IRawMultisigTx {
  id: number
  hash: string
  tx: string
  createdAt: Date
  updatedAt: Date
}
