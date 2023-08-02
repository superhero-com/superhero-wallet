/**
 * All utility helper functions.
 */

import { WatchSource, watch } from 'vue';
import { defer } from 'lodash-es';
import BigNumber from 'bignumber.js';
import type {
  BigNumberPublic,
  IPageableResponse,
  IRequestInitBodyParsed,
  Truthy,
} from '@/types';
import {
  DECIMAL_PLACES_HIGH_PRECISION,
  DECIMAL_PLACES_LOW_PRECISION,
  LOCAL_STORAGE_PREFIX,
} from '@/config';

/**
 * Round the number to calculated amount of decimals.
 * If the number is between high and low precision
 * no argument is passed to the `toFixed` method which means there will be no trailing zeros.
 */
export function amountRounded(rawAmount: number | BigNumberPublic): string {
  const ZERO_AND_COMA_LEN = 2;
  const amount: BigNumberPublic = (typeof rawAmount === 'object')
    ? rawAmount
    : new BigNumber(rawAmount);
  if (
    amount.lt(0.01)
    && amount.toString().length - ZERO_AND_COMA_LEN < DECIMAL_PLACES_HIGH_PRECISION
  ) {
    return amount.toFixed();
  }
  return amount.toFixed(
    (amount.lt(0.01))
      ? DECIMAL_PLACES_HIGH_PRECISION
      : DECIMAL_PLACES_LOW_PRECISION,
  );
}

export function calculateFontSize(amountValue: BigNumber | number) {
  const amountLength = amountRounded(amountValue).replace(/\D/g, '').length;

  if (amountLength <= 8) {
    return '18px';
  }
  if (amountLength <= 11) {
    return '16px';
  }
  if (amountLength <= 14) {
    return '14px';
  }
  return '12px';
}

/**
 * Check if the image is available by making a HEAD request.
 * Needed for Cordova because when using <img /> tag and the image is not available
 * the DOM ready event is not fired.
 */
export function checkImageAvailability(url: string): Promise<boolean> {
  // TODO: use { method: 'HEAD'} when backend will introduce a proper response in such case
  return fetch(url)
    .then((response) => !!response.ok)
    .catch(() => false);
}

export function compareCaseInsensitive(str1?: string, str2?: string) {
  return str1?.toLocaleLowerCase() === str2?.toLocaleLowerCase();
}

/**
 * Following function exists mostly to satisfy TypeScript engine and is a replacement for:
 * `.filter(Boolean)` => `.filter(excludeFalsy)`
 */
export function excludeFalsy<T>(value: T): value is Truthy<T> {
  return !!value;
}

export function executeAndSetInterval(handler: () => any, timeout: number) {
  handler();
  return setInterval(handler, timeout);
}

export async function fetchAllPages<T = any>(
  getFunction: () => Promise<IPageableResponse<T>>,
  getNextPage: (url: string) => Promise<IPageableResponse<T>>,
) {
  const result = [];
  let nextPageUrl: string | null = '';

  while (nextPageUrl !== null) {
    // eslint-disable-next-line no-await-in-loop
    const { data, next } = (await (nextPageUrl
      ? getNextPage(nextPageUrl)
      : getFunction())) as IPageableResponse<T>;

    if (data?.length) {
      result.push(...data);
    }

    nextPageUrl = next || null;
  }
  return result;
}

export async function fetchJson<T = any>(
  url: string,
  options?: RequestInit,
): Promise<T | null> {
  const response = await fetch(url, options);
  if (response.status === 204) {
    return null;
  }
  return response.json();
}

export function getLocalStorageItem<T = object>(keys: string[]): T | undefined {
  const result = window.localStorage.getItem(
    [LOCAL_STORAGE_PREFIX, ...keys].join('_'),
  );
  return result ? JSON.parse(result) : undefined;
}

/**
 * Replacement for `Array.includes` which has some TypeScript issues.
 * @link https://github.com/microsoft/TypeScript/issues/26255
 */
export function includes<T, U extends T>(
  arr: readonly U[],
  elem: T,
): elem is U {
  return arr.includes(elem as any);
}

export function includesCaseInsensitive(baseString: string, searchString: string) {
  return baseString?.toLocaleLowerCase().includes(searchString?.toLocaleLowerCase());
}

export function openInNewWindow(url: string) {
  window.open(url, '_blank');
}

export function pipe<T = any[]>(fns: ((data: T) => T)[]) {
  return (data: T) => fns.reduce((currData, func) => func(currData), data);
}

export function postJson(url: string, options?: IRequestInitBodyParsed) {
  return fetchJson(url, {
    method: 'post',
    headers: { 'Content-Type': 'application/json' },
    ...options,
    body: options?.body && JSON.stringify(options.body),
  });
}

export function setLocalStorageItem(keys: string[], value: any): void {
  return window.localStorage.setItem(
    [LOCAL_STORAGE_PREFIX, ...keys].join('_'),
    JSON.stringify(value),
  );
}

export function toShiftedBigNumber(value: number | string, precision: number): BigNumberPublic {
  return new BigNumber(value).shiftedBy(precision);
}

export function truncateString(text: string, maxLength: number) {
  return (text?.length)
    ? `${String(text).substring(0, maxLength)}${text.length > maxLength ? '...' : ''}`
    : '';
}

/**
 * Watch for the getter to be truthy with the use of the compositionApi.
 */
export function watchUntilTruthy<T>(getter: WatchSource<T>): Promise<NonNullable<T>> {
  return new Promise((resolve) => {
    const unwatch = watch(
      getter,
      (value) => {
        if (value) {
          resolve(value as NonNullable<T>);
          defer(() => unwatch());
        }
      },
      { immediate: true },
    );
  });
}
