/**
 * File contains maps of translations that allows to avoid using dynamic translation keys, eg.:
 * `t(`foo.bar.${someKey}`);`
 */

import type { TxFunctionMultisig, TxFunctionRaw, TxType } from '@/types';
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
