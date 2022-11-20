/* eslint-disable camelcase */

import { RawLocation } from 'vue-router';
import { TranslateResult } from 'vue-i18n';
import BigNumber from 'bignumber.js';

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
  transactionSignFirstAskedOn: any
  transactionSignLimit: number
  transactionSignLimitLeft: number
}

export type NotificationStatus = 'CREATED' | 'PEEKED' | 'READ';

export interface INotification {
  chainName?: string
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
  text?: string
  type: string
  updatedAt?: string
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

export type TxFunction = 'addLiquidity' |
  'addLiquidityAe' |
  'removeLiquidity' |
  'removeLiquidityAe' |
  'swapExactTokensForTokens' |
  'swapTokensForExactTokens' |
  'swapExactAeForTokens' |
  'swapTokensForExactAe' |
  'swapExactTokensForAe' |
  'swapAeForExactTokens' |
  'changeAllowance' |
  'transferAllowance' |
  'deposit' |
  'withdraw'

export interface ITx {
  abiVersion: number,
  amount: number
  contractId: string
  fee: number
  function: string,
  gas: number,
  gasPrice: number,
  gasUsed: number,
  nonce: number,
  result: string
  return:string
  returnType: string
  type: string
  callerId: string
  arguments: ITxArguments[]
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

export type TransactionType =
  'SpendTx' |
  'ContractCreateTx' |
  'ContractCallTx' |
  'NamePreclaimTx' |
  'NameClaimTx' |
  'NameUpdateTx' |
  'NameTransferTx' |
  'NameRevokeTx' |
  'OracleRegisterTx' |
  'OracleExtendTx' |
  'OraclePostQueryTx' |
  'OracleRespondTx' |
  'ChannelCloseSoloTx' |
  'ChannelSlashTx' |
  'ChannelSettleTx' |
  'ChannelSnapshotSoloTx';
