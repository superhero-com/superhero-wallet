/**
 * File contains maps of translations that allows to avoid using dynamic translation keys, eg.:
 * `t(`foo.bar.${someKey}`);`
 */

import type {
  SuperheroTxAction,
  TxFunctionMultisig,
  TxFunctionRaw,
  TxType,
} from '@/types';
import { tg } from '@/popup/plugins/i18n';

type TranslationMap<T extends string | number | symbol = string> = Partial<
  Record<T, () => string>
>;

/**
 * ITx.type translated into human-readable label
 */
const TX_TYPE_TRANSLATIONS: TranslationMap<TxType> = {
  ChannelCloseSoloTx: () => tg('transaction.type.channelCloseSoloTx'),
  ChannelSlashTx: () => tg('transaction.type.channelSlashTx'),
  ChannelSettleTx: () => tg('transaction.type.channelSettleTx'),
  ChannelSnapshotSoloTx: () => tg('transaction.type.channelSnapshotSoloTx'),
  ContractCreateTx: () => tg('transaction.type.contractCreateTx'),
  ContractCallTx: () => tg('transaction.type.contractCallTx'),
  GaMetaTx: () => tg('transaction.type.gaMetaTx'),
  GaAttachTx: () => tg('transaction.type.gaAttachTx'),
  NamePreclaimTx: () => tg('transaction.type.namePreclaimTx'),
  NameClaimTx: () => tg('transaction.type.nameClaimTx'),
  NameUpdateTx: () => tg('transaction.type.nameUpdateTx'),
  NameTransferTx: () => tg('transaction.type.nameTransferTx'),
  NameRevokeTx: () => tg('transaction.type.nameRevokeTx'),
  OracleRegisterTx: () => tg('transaction.type.oracleRegisterTx'),
  OracleExtendTx: () => tg('transaction.type.oracleExtendTx'),
  OracleQueryTx: () => tg('transaction.type.oraclePostQueryTx'),
  OracleResponseTx: () => tg('transaction.type.oracleRespondTx'),
  PayingForTx: () => tg('transaction.type.payingForTx'),
  SpendTx: () => tg('transaction.type.sentTx'),
};
export function getTxTypeLabel(txType: TxType): string {
  const translateFunc = TX_TYPE_TRANSLATIONS[txType];
  return translateFunc ? translateFunc() : '';
}

/**
 * Replacements for the `txTypeTranslations` displayed on the transaction lists
 * ITx.type
 */
const TX_TYPE_LIST_TRANSLATIONS: TranslationMap<TxType> = {
  NamePreclaimTx: () => tg('transaction.listType.namePreclaimTx'),
  NameClaimTx: () => tg('transaction.listType.nameClaimTx'),
  NameUpdateTx: () => tg('transaction.listType.nameUpdateTx'),
  NameTransferTx: () => tg('transaction.listType.nameTransferTx'),
  NameRevokeTx: () => tg('transaction.listType.nameRevokeTx'),
  SpendTx: () => tg('transaction.listType.sentTx'),
};
export function getTxTypeListLabel(txType: TxType): string {
  const translateFunc = TX_TYPE_LIST_TRANSLATIONS[txType];
  return translateFunc ? translateFunc() : '';
}

/**
 * ITx.function translated into human-readable label
 */
const TX_FUNCTION_TRANSLATIONS: TranslationMap<TxFunctionRaw | TxFunctionMultisig> = {
  propose: () => tg('transaction.function.propose'),
  revoke: () => tg('transaction.function.revoke'),
  refuse: () => tg('transaction.function.refuse'),
  confirm: () => tg('transaction.function.confirm'),
  tip_token: () => tg('transaction.function.tip_token'),
  retip_token: () => tg('transaction.function.retip_token'),
};
export function getTxFunctionLabel(txFunction: TxFunctionRaw | TxFunctionMultisig): string {
  const translateFunc = TX_FUNCTION_TRANSLATIONS[txFunction];
  return translateFunc ? translateFunc() : '';
}

/**
 * Superhero app contract calls, displayed on the transaction details.
 */
const SUPERHERO_TX_TRANSLATIONS: Record<SuperheroTxAction, () => string> = {
  post: () => tg('transaction.superhero.type.post'),
  comment: () => tg('transaction.superhero.type.comment'),
  follow: () => tg('transaction.superhero.type.follow'),
  unfollow: () => tg('transaction.superhero.type.unfollow'),
  block: () => tg('transaction.superhero.type.block'),
  unblock: () => tg('transaction.superhero.type.unblock'),
  delegate: () => tg('transaction.superhero.type.delegate'),
  revokeDelegation: () => tg('transaction.superhero.type.revokeDelegation'),
  addPoll: () => tg('transaction.superhero.type.addPoll'),
  createInvites: () => tg('transaction.superhero.type.createInvites'),
  revokeInvite: () => tg('transaction.superhero.type.revokeInvite'),
  collectRewards: () => tg('transaction.superhero.type.collectRewards'),
  redeemInvite: () => tg('transaction.superhero.type.redeemInvite'),
};
export function getSuperheroTxLabel(action: SuperheroTxAction): string {
  return SUPERHERO_TX_TRANSLATIONS[action]();
}

/**
 * Superhero app contract calls, displayed on the transaction lists.
 */
const SUPERHERO_TX_LIST_TRANSLATIONS: Record<SuperheroTxAction, () => string> = {
  post: () => tg('transaction.superhero.listType.post'),
  comment: () => tg('transaction.superhero.listType.comment'),
  follow: () => tg('transaction.superhero.listType.follow'),
  unfollow: () => tg('transaction.superhero.listType.unfollow'),
  block: () => tg('transaction.superhero.listType.block'),
  unblock: () => tg('transaction.superhero.listType.unblock'),
  delegate: () => tg('transaction.superhero.listType.delegate'),
  revokeDelegation: () => tg('transaction.superhero.listType.revokeDelegation'),
  addPoll: () => tg('transaction.superhero.listType.addPoll'),
  createInvites: () => tg('transaction.superhero.listType.createInvites'),
  revokeInvite: () => tg('transaction.superhero.listType.revokeInvite'),
  collectRewards: () => tg('transaction.superhero.listType.collectRewards'),
  redeemInvite: () => tg('transaction.superhero.listType.redeemInvite'),
};
export function getSuperheroTxListLabel(action: SuperheroTxAction): string {
  return SUPERHERO_TX_LIST_TRANSLATIONS[action]();
}
