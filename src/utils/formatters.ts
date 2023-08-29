import dayjs from '@/popup/plugins/dayjsConfig';
import { DEFAULT_LOCALE } from '@/constants';

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
