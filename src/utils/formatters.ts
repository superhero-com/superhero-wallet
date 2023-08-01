import dayjs from '@/popup/plugins/dayjsConfig';

export function escapeSpecialChars(str: string = ''): string {
  return str.replace(/(\r\n|\n|\r|\n\r)/gm, ' ').replace(/"/g, '');
}

// TODO: Use the current language from i18n module
export function formatDate(time: number) {
  return new Date(+time).toLocaleDateString(navigator.language, {
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
export function formatNumber(value: number) {
  return new Intl.NumberFormat(navigator.language).format(value);
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
