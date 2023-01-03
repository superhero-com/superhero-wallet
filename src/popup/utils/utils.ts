import Vue from 'vue';
import VueCompositionApi, {
  watch,
} from '@vue/composition-api';
import BigNumber from 'bignumber.js';
import { defer } from 'lodash-es';
import { TxBuilderHelper } from '@aeternity/aepp-sdk';
import {
  ADDRESS_TYPES,
  AENS_DOMAIN,
  HASH_PREFIX_CONTRACT,
  HASH_REGEX,
  SIMPLEX_URL,
} from './constants';
import { i18n } from '../../store/plugins/languages';
import dayjs from '../plugins/dayjsConfig';
import type {
  IRespondChallenge,
  IResponseChallenge,
  ISdk,
  ITransaction,
} from '../../types';

Vue.use(VueCompositionApi);

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

export const validateHash = (fullHash?: string) => {
  const isName = !!fullHash?.endsWith(AENS_DOMAIN);
  let valid = false;
  let prefix = null;
  let hash = null;

  if (fullHash) {
    [prefix, hash] = fullHash.split('_');
    valid = (ADDRESS_TYPES[prefix] && HASH_REGEX.test(hash)) || isName;
  }

  return {
    valid, isName, prefix, hash,
  };
};

export function getMdwEndpointPrefixForHash(fullHash: string) {
  const { valid, isName, prefix } = validateHash(fullHash);

  if (!valid || !prefix) {
    return null;
  }

  if (isName) {
    return ADDRESS_TYPES.nm;
  }
  return ADDRESS_TYPES[prefix];
}

export function isContract(fullHash: string) {
  const { valid, prefix } = validateHash(fullHash);
  return (valid && prefix === HASH_PREFIX_CONTRACT);
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

/**
 * Watch for the getter to be truthy with the use of the compositionApi.
 */
export function watchUntilTruthy<T>(getter: () => T): Promise<NonNullable<T>> {
  return new Promise((resolve) => {
    const unwatch = watch(
      getter,
      (value) => {
        if (!value) return;
        resolve(getter() as NonNullable<T>);
        defer(() => unwatch());
      },
      { immediate: true },
    );
  });
}

export function splitAddress(address: string | null): string {
  return address ? address.match(/.{1,3}/g)!.reduce((acc, current) => `${acc} ${current}`) : '';
}

export function relativeTimeTo(date: string): string {
  return dayjs().to(dayjs(date));
}

// TODO - move to sdk.ts composable after the removal of action.js file
export async function fetchRespondChallenge(
  sdk: ISdk,
  responseChallenge: IResponseChallenge,
): Promise<IRespondChallenge> {
  const signedChallenge = Buffer.from(
    await sdk.signMessage(responseChallenge.challenge),
  ).toString('hex');

  return {
    challenge: responseChallenge.challenge,
    signature: signedChallenge,
  };
}

export function getPayload(transaction: ITransaction) {
  return (transaction.tx?.payload)
    ? TxBuilderHelper.decode(transaction.tx?.payload).toString()
    : null;
}
