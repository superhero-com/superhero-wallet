/* eslint-disable camelcase, no-unused-vars */

import { RawLocation } from 'vue-router';
import { TranslateResult } from 'vue-i18n';
import BigNumber from 'bignumber.js';
import { POPUP_TYPES } from '../popup/utils';

export * from './cordova';
export * from './router';

export interface IToken {
  contractId: string
  convertedBalance?: number
  decimals: number
  id?: string // Only for the Aeternity coin
  name: string
  symbol: string,
  extension?: string[]
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
  convertedBalance: BigNumber
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
  decimals?: number,
}

export interface IAccount {
  address: string
  idx: number
  name: string // .chain
  publicKey: Uint8Array
  secretKey: Uint8Array
  showed: boolean
  type: string
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
  type: string,
  value: string | number | any[],
}

export type TxFunction =
  | 'addLiquidity'
  | 'addLiquidityAe'
  | 'removeLiquidity'
  | 'removeLiquidityAe'
  | 'swapExactTokensForTokens'
  | 'swapTokensForExactTokens'
  | 'swapExactAeForTokens'
  | 'swapTokensForExactAe'
  | 'swapExactTokensForAe'
  | 'swapAeForExactTokens'
  | 'changeAllowance'
  | 'transferAllowance'
  | 'deposit'
  | 'withdraw'

export interface ITx {
  abiVersion: number,
  amount: number,
  contractId: string,
  fee: number,
  function: string,
  gas: number,
  gasPrice: number,
  gasUsed: number,
  nonce: number,
  result: string,
  return:string,
  returnType: string,
  type: string,
  callerId: string,
  senderId?: string,
  recipientId?: string,
  selectedTokenContractId?: string,
  arguments: ITxArguments[],
  payload?: string
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

export interface IDexContracts {
  router: string[],
  wae: string[],
}

/**
 * Browser popup window names
 */
export type IPopupType = typeof POPUP_TYPES[number];

/**
 * Temporary typing for the SDK used in the app.
 * TODO remove after migrating to SDK v12
 */
export type ISignMessage = (m: any) => Promise<any>

export interface ISdk {
  api: Record<string, (a: string) => any>
  Ae: Record<string, any>
  pool: Map<string, any>
  getContractInstance: (o: any) => any
  signTransaction: (t: any, o: any) => Promise<any>
  signMessage: ISignMessage
  sendTransaction: (t: any, o: any) => Promise<any>
  spend: (a: any, r: any, o: any) => Promise<any>
  address: () => Promise<string>
  aensBid: (name: string, aettos: any) => Promise<any>
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

export interface IMiddleware extends
  IMiddlewareClient,
  IMiddlewareCustomMethods {}

/* eslint-disable camelcase */
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
/* eslint-enable camelcase */

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
