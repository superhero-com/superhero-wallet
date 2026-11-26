import BigNumber from 'bignumber.js';
import dayjs from '@/popup/plugins/dayjsConfig';
import { DECIMAL_PLACES_LOW_PRECISION, DEFAULT_LOCALE } from '@/constants';

export function escapeSpecialChars(str: string = ''): string {
  return str.replace(/(\r\n|\n|\r|\n\r)/gm, ' ').replace(/"/g, '');
}

// TODO: Use the current language from i18n module or allow the user to select his formatting
export function formatDate(time: number) {
  return new Date(+time).toLocaleDateString(DEFAULT_LOCALE, {
    year: '2-digit',
    month: '2-digit',
    day: '2-digit',
  });
}

/**
 * Make the number more readable by adding spaces, commas or dots.
 * Eg.: 411149751.49932 -> 411 149 751,499 (for the europe)
 *      411149751.49932 -> 411.149.751,499 (for the USA)
 */
export function formatNumber(value: number, options: Intl.NumberFormatOptions = {}) {
  return new Intl.NumberFormat(DEFAULT_LOCALE, options).format(value);
}

/**
 * Make the number more readable by adding spaces, commas or dots (as formatNumber)
 * but returns a number as an array of parts
 * Eg.: 123,45 -> [
 *   { type: "integer", value: "123" },
 *   { type: "decimal", value: "," },
 *   { type: "fraction", value: "45" }
 * ]
 */
export function formatNumberParts(value: number, options: Intl.NumberFormatOptions = {}) {
  return new Intl.NumberFormat(DEFAULT_LOCALE, options).formatToParts(value);
}

export interface IFormatAmountOptions {
  /** The most decimals shown */
  maxDecimals: number;
  /** Cut to this many significant digits, keeping at least 2 decimals */
  significantDigits?: number;
  /** Pad the decimals with zeros up to this count */
  minDecimals?: number;
}

/**
 * Cut the decimals of an amount down, never up, so it never reads more than it is,
 * up to the 15 significant digits a float holds.
 * Eg. with 6 significant digits: 4.99983082 -> 4.99983, 1234.5678 -> 1,234.56
 */
function getAmountFormat(
  value: BigNumber.Value,
  { maxDecimals, significantDigits, minDecimals = 0 }: IFormatAmountOptions,
) {
  // Drops float noise, eg. 0.3 - 0.1 = 0.19999999999999998
  const amount = new BigNumber(typeof value === 'number' ? value.toPrecision(15) : value);
  const decimals = (significantDigits && amount.e !== null)
    ? Math.min(
      maxDecimals,
      Math.max(DECIMAL_PLACES_LOW_PRECISION, significantDigits - 1 - amount.e),
    )
    : maxDecimals;
  const options = {
    minimumFractionDigits: minDecimals,
    maximumFractionDigits: Math.max(decimals, minDecimals),
  };
  // Past 15 digits a float can't tell noise from digits, so Intl rounds it to the nearest
  if (typeof value === 'number' && amount.e !== null && amount.e + 1 + decimals > 15) {
    return { amount: value, options };
  }
  return {
    amount: amount.decimalPlaces(decimals, BigNumber.ROUND_DOWN).toNumber(),
    options,
  };
}

export function formatAmount(
  value: BigNumber.Value,
  options: IFormatAmountOptions,
): string {
  const { amount, options: formatOptions } = getAmountFormat(value, options);
  return formatNumber(amount, formatOptions);
}

export function formatAmountParts(
  value: BigNumber.Value,
  options: IFormatAmountOptions,
) {
  const { amount, options: formatOptions } = getAmountFormat(value, options);
  return formatNumberParts(amount, formatOptions);
}

export function formatTime(time: number) {
  return new Date(+time).toLocaleTimeString(navigator.language, {
    timeStyle: 'short',
  });
}

export function relativeTimeTo(date: string): string {
  return dayjs().to(dayjs(date));
}

export function toURL(url: string): URL {
  return new URL(url.includes('://') ? url : `https://${url}`);
}
