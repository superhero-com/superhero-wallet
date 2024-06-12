/**
 * All utility helper functions.
 */

/* eslint-disable no-use-before-define */

import { WatchSource, watch } from 'vue';
import { defer, uniqWith } from 'lodash-es';
import BigNumber from 'bignumber.js';
import { Share } from '@capacitor/share';
import { ComposerTranslation } from 'vue-i18n';
import { LocationQuery } from 'vue-router';
import type {
  AccountAddress,
  AssetContractId,
  BigNumberPublic,
  IAccount,
  ICommonTransaction,
  IDashboardTransaction,
  IFormSelectOption,
  IHdWalletAccount,
  IPageableResponse,
  IRequestInitBodyParsed,
  ITokenResolved,
  ITransaction,
  StorageKeysInput,
  Truthy,
} from '@/types';
import {
  ACCOUNT_TYPES,
  ADDRESS_GAP_LIMIT,
  AGGREGATOR_URL,
  DECIMAL_PLACES_HIGH_PRECISION,
  DECIMAL_PLACES_LOW_PRECISION,
  LOCAL_STORAGE_PREFIX,
  NETWORK_TYPE_MAINNET,
  NETWORK_TYPE_TESTNET,
  PROTOCOL_LIST,
  TX_DIRECTION,
} from '@/constants';
import { tg } from '@/popup/plugins/i18n';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';

/**
 * Round the number to calculated amount of decimals.
 * If the number is between high and low precision
 * no argument is passed to the `toFixed` method which means there will be no trailing zeros.
 */
export function amountRounded(rawAmount: number | BigNumberPublic | string): string {
  const ZERO_AND_COMA_LEN = 2;
  const amount: BigNumberPublic = (typeof rawAmount === 'object')
    ? rawAmount
    : new BigNumber(Number(rawAmount));
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

export function blocksToRelativeTime(blocks: number) {
  return secondsToRelativeTime(blocks * 3 * 60);
}

export function calculateFontSize(amountValue: BigNumber | number | string) {
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
 * Needed for Ionic because when using <img /> tag and the image is not available
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
 * Prefix all the storage keys and build the key string.
 */
export function composeStorageKeys(keys: StorageKeysInput): string {
  return [
    LOCAL_STORAGE_PREFIX,
    ...Array.isArray(keys) ? keys : [keys],
  ].join('_');
}

/**
 * Convert wrapped coin tokens into coins (eg.: WAE => AE).
 */
export function convertWrappedCoinTokenToCoin(asset: ITokenResolved): ITokenResolved {
  return (asset.isWrappedCoin && asset.protocol)
    ? {
      ...asset,
      ...ProtocolAdapterFactory.getAdapter(asset.protocol).getDefaultCoin(),
    }
    : asset;
}

export function errorHasValidationKey(error: any, expectedKey: string): boolean {
  return error.validation?.some(({ key }: any) => expectedKey === key);
}

/**
 * Create list of callbacks
 */
export function createCallbackRegistry<T extends(...args: any) => any>() {
  let currentId = 0;
  const callbackRegistry = new Map<number, T>();

  return {
    /**
     * Add callback that will be fired when `runCallbacks` is ran.
     * @returns function that allows to remove the callback from registry.
     */
    addCallback: (callback: T) => {
      currentId += 1;
      const savedId = currentId;
      callbackRegistry.set(savedId, callback);
      return () => callbackRegistry.delete(savedId);
    },
    runCallbacks: (...args: Parameters<T>) => {
      callbackRegistry.forEach((callback) => callback?.(...args as Array<any>));
    },
  };
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
  getFunction: () => Promise<IPageableResponse<T> | null>,
  getNextPage: (url: string) => Promise<IPageableResponse<T> | null>,
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

/**
 * Prepare human-readable name with protocol for an account.
 * E.g.: `Æternity account 1`, `Bitcoin account 2`
 */

export function getDefaultAccountLabel(
  { protocol, idx, type }: Partial<IAccount> = {},
): string {
  const accountTypeName = (() => {
    switch (true) {
      case type === ACCOUNT_TYPES.airGap: return tg('airGap.title');
      default: return protocol ? ProtocolAdapterFactory.getAdapter(protocol).protocolName : null;
    }
  })();

  return [
    accountTypeName,
    tg('pages.account.heading'),
    (idx || 0) + 1,
  ]
    .filter(excludeFalsy)
    .join(' ');
}

export function getLocalStorageItem<T = object>(keys: string[]): T | undefined {
  const result = window.localStorage.getItem(prepareStorageKey(keys));
  return result ? JSON.parse(result) : undefined;
}

export function removeLocalStorageItem(keys: string[]) {
  return window.localStorage.removeItem(
    [LOCAL_STORAGE_PREFIX, ...keys].join('_'),
  );
}

/**
 * Removes `propertyName: undefined` from the object.
 * `{ a: 1, b: undefined }` => `{ a: 1 }`
 */
export function removeObjectUndefinedProperties(obj: object): object {
  return Object.fromEntries(Object.entries(obj).filter((item) => item[1] !== undefined));
}

/**
 * TODO: Probably we need to replace this with Logger.write
 */
export function handleUnknownError(error: any) {
  // eslint-disable-next-line no-console
  return console.warn('Unknown rejection', error);
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

/**
 * Invokes the native sharing mechanism of the device to share data such as text.
 * The Share API works on iOS, Android, and the Web
 */
export async function invokeDeviceShare(text: string): Promise<void> {
  const canShare = (await Share.canShare()).value;

  if (canShare) {
    await Share.share({ text });
  }
}

export function isNotFoundError(error: any) {
  return error?.statusCode === 404;
}

/**
 * Check if object has at least one property with a value, where 0 is also a correct value.
 * `{ test: null }` => false
 * `{ test: 'Foo' }` => true
 * `{ test: 0 }` => true
 */
export function objectHasNonEmptyProperties(obj: object): boolean {
  return Object.values(obj).some((val) => ![null, undefined, false].includes(val));
}

export function openInNewWindow(url: string) {
  window.open(url, '_blank');
}

export function pipe<T = any[]>(fns: ((data: T) => T)[]) {
  return (data: T) => fns.reduce((currData, func) => func(currData), data);
}

/**
 * Run asynchronous callbacks one by one and pass previous returned value to the next one.
 */
export function asyncPipe<T = any[]>(fns: ((data: T) => PromiseLike<T>)[]) {
  return (data: T): Promise<T> => fns.reduce(
    async (currData, func) => func(await currData),
    Promise.resolve(data),
  );
}

export function prepareStorageKey(keys: string[]) {
  return [LOCAL_STORAGE_PREFIX, ...keys].join('_');
}

export function postJson(url: string, options?: IRequestInitBodyParsed) {
  return fetchJson(url, {
    method: 'post',
    headers: { 'Content-Type': 'application/json' },
    ...options,
    body: options?.body && JSON.stringify(options.body),
  });
}

/**
 * Accounts data formatted as the form select options
 */
export function prepareAccountSelectOptions(accountList: IAccount[]): IFormSelectOption[] {
  return accountList.map((acc): IFormSelectOption => ({
    text: getDefaultAccountLabel(acc),
    value: acc.address,
  }));
}

export function removeDuplicatedTransactions(transactions: ITransaction[]) {
  return uniqWith(
    transactions,
    (a, b) => (a.hash === b.hash && a.transactionOwner === b.transactionOwner),
  );
}

export function secondsToRelativeTime(seconds: number, shortForm?: boolean) {
  const t = tg as ComposerTranslation;
  const secondsPerMinute = 60;
  const secondsPerHour = secondsPerMinute * 60;
  const secondsPerDay = secondsPerHour * 24;
  if (seconds < secondsPerMinute) {
    return (shortForm)
      ? t('common.secondsShort', Math.round(seconds))
      : t('common.seconds', Math.round(seconds));
  }
  if (seconds < secondsPerHour) {
    return (shortForm)
      ? t('common.minutesShort', Math.round(seconds / secondsPerMinute))
      : t('common.minutes', Math.round(seconds / secondsPerMinute));
  }
  if (seconds < secondsPerDay) {
    return (shortForm)
      ? t('common.hoursShort', Math.round(seconds / secondsPerHour))
      : t('common.hours', Math.round(seconds / secondsPerHour));
  }
  return t('common.days', Math.round(seconds / secondsPerDay));
}

export function setLocalStorageItem(keys: string[], value: any): void {
  return window.localStorage.setItem(
    prepareStorageKey(keys),
    JSON.stringify(value),
  );
}

export async function sleep<T>(ms: number, fn?: () => Promise<T>) {
  await new Promise((resolve) => setTimeout(resolve, ms));
  return fn?.();
}

export function sortTransactionsByDate(transactions: ICommonTransaction[]) {
  return transactions.sort((a, b) => {
    const [aMicroTime, bMicroTime] = [a, b].map(
      (transaction) => (
        new Date(transaction.microTime!).getTime()
      ),
    );

    const pending = (a.pending && !b.pending && -1) || (b.pending && !a.pending && 1);
    const compareMicroTime = () => {
      const withoutTimeIndex = [aMicroTime, bMicroTime].findIndex((time) => Number.isNaN(time));
      if (withoutTimeIndex === 0) {
        return -1;
      }
      if (withoutTimeIndex === 1) {
        return 1;
      }
      const sortDirection = bMicroTime - aMicroTime;
      // Workaround to display received transaction after send (they have the same time)
      if (sortDirection === 0) {
        const { direction = TX_DIRECTION.received } = a as IDashboardTransaction;
        return direction === TX_DIRECTION.received ? -1 : 1;
      }

      return sortDirection;
    };
    return pending || compareMicroTime();
  });
}

export function splitAddress(address: string | null): string {
  return address
    ? address.match(/.{1,3}/g)!.reduce((acc, current) => `${acc} ${current}`)
    : '';
}

export function toHex(value: string) {
  return `0x${parseInt(value, 10).toString(16)}`;
}

export function toShiftedBigNumber(value: number | string, precision: number): BigNumberPublic {
  return new BigNumber(value).shiftedBy(precision);
}

export function truncateAddress(address: string | null): [string, string] {
  if (!address) {
    return ['', ''];
  }
  const addressLength = address.length;
  const firstPart = address.slice(0, 6).match(/.{3}/g) as string[];
  const secondPart = address
    .slice(addressLength - 3, addressLength)
    .match(/.{3}/g) as string[];
  return [
    firstPart?.slice(0, 2).reduce((acc, current) => `${acc}${current}`),
    secondPart.slice(-1).reduce((acc, current) => `${acc}${current}`),
  ];
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

/**
 * @returns {number} between -1 and n where -1 means there are no accounts found.
 */
export async function getLastNotEmptyAccountIndex(
  isAccountUsed: (address: string) => Promise<boolean>,
  getHdWalletAccountFromMnemonicSeed: (
    seed: Uint8Array,
    accountIndex: number,
  ) => IHdWalletAccount,
  wallet: Uint8Array,
): Promise<number> {
  let lastNotEmptyIdx = 0;
  let lastIndex = 0;
  let isAccountUsedArray: boolean[] = [];
  do {
    try {
      lastNotEmptyIdx = isAccountUsedArray.lastIndexOf(true) + lastIndex;
      lastIndex += isAccountUsedArray.length;

      // eslint-disable-next-line no-await-in-loop
      isAccountUsedArray = await Promise.all(
        Array.from(
          Array(ADDRESS_GAP_LIMIT + lastNotEmptyIdx - lastIndex + 1).keys(),
          // eslint-disable-next-line no-loop-func
          (x) => x + lastIndex,
        )
          .map((index) => isAccountUsed(
            getHdWalletAccountFromMnemonicSeed(wallet, index).address,
          )),
      );
    } catch (e) {
      break;
    }
  } while (!(
    isAccountUsedArray.lastIndexOf(true) === -1
    || isAccountUsedArray.filter((isAccountUsedValue) => !isAccountUsedValue)
      .length === ADDRESS_GAP_LIMIT
  ));
  return lastNotEmptyIdx;
}

export function checkIfSuperheroCallbackUrl(query: LocationQuery) {
  const slicedAggregatorUrl = AGGREGATOR_URL.endsWith('/') ? AGGREGATOR_URL.slice(0, -1) : AGGREGATOR_URL;

  return [query['x-success'], query['x-cancel']].every(
    (value) => value && (value as string).startsWith(slicedAggregatorUrl),
  );
}

export function isAssetCoin(assetContractId: AssetContractId): boolean {
  return PROTOCOL_LIST.some(
    (protocol) => ProtocolAdapterFactory
      .getAdapter(protocol)
      .coinContractId === assetContractId,
  );
}

/**
 * Clean options from members that cause issues when sending messages
 * or when signing transactions.
 */
export function getCleanModalOptions<T>(options: T): Omit<T, 'onCompiler' | 'onNode'> {
  const cleanedOptions: any = { ...options };
  delete cleanedOptions?.onCompiler;
  delete cleanedOptions?.onNode;
  return cleanedOptions;
}

export const fromBase64Url = (data: string): Buffer => Buffer
  .from(data.replace(/_/g, '/').replace(/-/g, '+'), 'base64');

export const toBase64Url = (data: Buffer | Uint8Array | string): string => Buffer
  .from(data)
  .toString('base64')
  .replace(/\//g, '_')
  .replace(/\+/g, '-')
  .replace(/=+$/, '');

/**
 * Get protocol by address regardless of the active network.
 */
export function getProtocolByAddress(address: AccountAddress) {
  let adapter = ProtocolAdapterFactory.getAdapterByAccountAddress(address, NETWORK_TYPE_MAINNET);
  if (!adapter) {
    adapter = ProtocolAdapterFactory.getAdapterByAccountAddress(address, NETWORK_TYPE_TESTNET);
  }
  return adapter?.protocol;
}
