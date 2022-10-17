import BigNumber from 'bignumber.js';
import { HASH_REGEX, SIMPLEX_URL } from './constants';
import { i18n } from '../../store/plugins/languages';

export function isNumbersEqual(a: number, b: number) {
  return new BigNumber(a).eq(b);
}

export function convertToken(balance: number, precision: number) {
  return new BigNumber(balance).shiftedBy(precision);
}

export const executeAndSetInterval = (handler: () => any, timeout: number) => {
  handler();
  return setInterval(handler, timeout);
};

// TODO: Use the current language from i18n module
export function formatDate(time: number) {
  return new Date(+time)
    .toLocaleDateString(navigator.language, {
      year: '2-digit',
      month: '2-digit',
      day: '2-digit',
    });
}

export function formatTime(time: number) {
  return new Date(+time).toLocaleTimeString(navigator.language, {
    timeStyle: 'short',
  });
}

export function checkHashType(fullHash: string) {
  const addressTypes: Record<string, string> = {
    ak: 'account/transactions',
    ct: 'contracts/transactions',
    nm: 'names',
    ok: 'oracles/queries',
    th: 'transactions',
  };
  const [prefix, hash] = fullHash.split('_');

  let valid: boolean = false;
  let endpoint: string | null = null;

  if (fullHash.endsWith('.chain')) {
    valid = true;
    endpoint = addressTypes.nm;
  } else if (addressTypes[prefix] && HASH_REGEX.test(hash)) {
    valid = true;
    endpoint = addressTypes[prefix];
  }

  return { valid, endpoint, prefix };
}

export function escapeSpecialChars(str = '') {
  return str.replace(/(\r\n|\n|\r|\n\r)/gm, ' ').replace(/"/g, '');
}

export function secondsToRelativeTime(seconds: number) {
  const secondsPerMinute = 60;
  const secondsPerHour = secondsPerMinute * 60;
  const secondsPerDay = secondsPerHour * 24;

  if (seconds < secondsPerMinute) {
    return i18n.tc('seconds', Math.round(seconds));
  }
  if (seconds < secondsPerHour) {
    return i18n.tc('minutes', Math.round(seconds / secondsPerMinute));
  }
  if (seconds < secondsPerDay) {
    return i18n.tc('hours', Math.round(seconds / secondsPerHour));
  }
  return i18n.tc('days', Math.round(seconds / secondsPerDay));
}

export function blocksToRelativeTime(blocks: number) {
  return secondsToRelativeTime(blocks * 3 * 60);
}

export function buildSimplexLink(address: string) {
  const link = new URL(SIMPLEX_URL);
  link.searchParams.set('wallet_address', address);
  return link.toString();
}

export function chunkString(text: string, length: number) {
  const space = [];
  for (let i = 0, len = text.length; i < len; i += length) {
    space.push(text.substr(i, length));
  }
  return space;
}
