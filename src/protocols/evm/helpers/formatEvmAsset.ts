import BigNumber from 'bignumber.js';

import { tg } from '@/popup/plugins/i18n';
import { isUnlimitedAmount } from './decodeEvmCallIntent';
import type { IEvmTokenMeta } from './evmAddressInfo';

export function shortEvmAddress(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

/** Letters, digits and a few signs: a symbol a token picks can't pose as an address or a note */
const SHOWN_SYMBOL = /^[\p{L}\p{M}\p{N}\p{Sc}._+-]+$/u;
/** More marks on one letter draw over the lines around it */
const STACKED_MARKS = /\p{M}{3}/u;

/** The symbol of a token or collection, unless it holds anything else */
export function getEvmSymbol(meta?: IEvmTokenMeta) {
  return (meta?.symbol && SHOWN_SYMBOL.test(meta.symbol) && !STACKED_MARKS.test(meta.symbol))
    ? meta.symbol
    : undefined;
}

/** The symbol of a token or collection, or its address while that isn't known or can't be shown */
export function getEvmAssetLabel(address: string, meta?: IEvmTokenMeta) {
  return getEvmSymbol(meta) ?? shortEvmAddress(address);
}

/** An amount in base units, in the token's unit when its decimals are known */
export function formatEvmTokenAmount(
  amount: string,
  token: string,
  meta?: IEvmTokenMeta,
  canBeUnlimited = true,
  /** The symbol, or the address while that isn't known or can't be shown */
  label = getEvmAssetLabel(token, meta),
) {
  if (meta?.decimals === undefined) {
    return tg('modals.evmCallSummary.baseUnits', { amount, token: label });
  }
  if (canBeUnlimited && isUnlimitedAmount(amount)) {
    return tg('modals.evmCallSummary.unlimited', { symbol: label });
  }
  return `${new BigNumber(amount).shiftedBy(-meta.decimals).toFormat()} ${label}`;
}

/** A time given in Unix seconds; far beyond what a date can hold is never */
export function formatEvmTime(seconds: string) {
  const date = new Date(Number(seconds) * 1000);
  return Number.isNaN(date.getTime())
    ? tg('modals.evmCallSummary.never')
    : date.toLocaleString();
}
