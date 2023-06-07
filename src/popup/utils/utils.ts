import {
  watch,
  WatchSource,
} from 'vue';
import { isFQDN, isURL } from 'validator';
import BigNumber from 'bignumber.js';
import { defer } from 'lodash-es';
import {
  SCHEMA,
  AmountFormatter,
  Crypto,
  TxBuilder,
  TxBuilderHelper,
  InvalidTxError,
} from '@aeternity/aepp-sdk';
import { derivePathFromKey, getKeyPair } from '@aeternity/hd-wallet/src/hd-key';
import { useI18n } from 'vue-i18n';
import {
  ADDRESS_TYPES,
  AENS_DOMAIN,
  AENS_NAME_MAX_LENGTH,
  AETERNITY_COIN_PRECISION,
  AETERNITY_CONTRACT_ID,
  TX_DIRECTION,
  HASH_PREFIX_CONTRACT,
  HASH_PREFIX_NAME,
  HASH_REGEX,
  LOCAL_STORAGE_PREFIX,
  MAX_UINT256,
  SEED_LENGTH,
  SIMPLEX_URL,
  SUPPORTED_TX_TYPES,
  STUB_ADDRESS,
  STUB_CALLDATA,
  STUB_NONCE,
  TX_FUNCTIONS,
  TX_TYPE_MDW,
  FUNCTION_TYPE_DEX,
  TRANSACTION_OWNERSHIP_STATUS,
} from './constants';
import { i18n } from '../../store/plugins/languages';
import dayjs from '../plugins/dayjsConfig';
import type {
  IAccount,
  IRespondChallenge,
  IResponseChallenge,
  ISdk,
  ITransaction,
  ITx,
  TxType,
  BigNumberPublic,
  IPendingTransaction,
  IPageableResponse,
  IDashboardTransaction,
  INameEntryFetched,
  IWallet,
  IRequestInitBodyParsed,
  IActiveMultisigTransaction,
  IDexContracts,
  TxFunctionRaw,
  ICommonTransaction,
  Truthy,
} from '../../types';
import { IS_IONIC, IS_EXTENSION } from '../../lib/environment';

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

export function pipe<T = any[]>(fns: ((data: T) => T)[]) {
  return (data: T) => fns.reduce((currData, func) => func(currData), data);
}

/**
 * Following function exists mostly to satisfy TypeScript engine and is a replacement for:
 * `.filter(Boolean)` => `.filter(excludeFalsy)`
 */
export function excludeFalsy<T>(value: T): value is Truthy<T> {
  return !!value;
}

export function isNumbersEqual(a: number, b: number) {
  return new BigNumber(a).eq(b);
}

export function getLocalStorageItem<T = object>(keys: string[]): T | null {
  const result = window.localStorage.getItem(
    [LOCAL_STORAGE_PREFIX, ...keys].join('_'),
  );
  return result ? JSON.parse(result) : null;
}

export function setLocalStorageItem(keys: string[], value: any): void {
  return window.localStorage.setItem(
    [LOCAL_STORAGE_PREFIX, ...keys].join('_'),
    JSON.stringify(value),
  );
}

export function convertToken(balance: number | string, precision: number): BigNumberPublic {
  return new BigNumber(balance).shiftedBy(precision);
}

export function executeAndSetInterval(handler: () => any, timeout: number) {
  handler();
  return setInterval(handler, timeout);
}

export function handleUnknownError(error: any) {
  // eslint-disable-next-line no-console
  return console.warn('Unknown rejection', error);
}

export function isNotFoundError(error: any) {
  return error?.statusCode === 404;
}

export function isAccountNotFoundError(error: any) {
  return isNotFoundError(error) && error?.response?.body?.reason === 'Account not found';
}

// TODO: Use the current language from i18n module
export function formatDate(time: number) {
  return new Date(+time).toLocaleDateString(navigator.language, {
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

/**
 * Make the number more readable by adding spaces, commas or dots.
 * Eg.: 411149751.49932 -> 411 149 751,499 (for the europe)
 *      411149751.49932 -> 411.149.751,499 (for the USA)
 */
export function formatNumber(value: number) {
  return new Intl.NumberFormat(navigator.language).format(value);
}

export function toURL(url: string): URL {
  return new URL(url.includes('://') ? url : `https://${url}`);
}

export function truncateAddress(address: string): [string, string] {
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

export function getAddressByNameEntry(nameEntry: INameEntryFetched, pointer = 'account_pubkey') {
  return ((nameEntry.pointers && nameEntry.pointers.find(({ key }) => key === pointer)) || {}).id;
}

export function isValidURL(url: string): boolean {
  const pattern = new RegExp(/((http(s)?:\/\/)?(localhost|127.0.0.1)((:)?[\0-9]{4})?\/?)/, 'i');
  return isURL(url) || !!pattern.test(url);
}

export function validateTipUrl(urlAsString: string): boolean {
  try {
    const url = toURL(urlAsString);
    return ['http:', 'https:'].includes(url.protocol) && isFQDN(url.hostname);
  } catch (e) {
    return false;
  }
}

export function validateSeedLength(seed: string) {
  return seed && seed.split(' ').length >= SEED_LENGTH;
}

export function validateHash(fullHash?: string) {
  const isName = !!fullHash?.endsWith(AENS_DOMAIN);
  let valid = false;
  let prefix = null;
  let hash = null;

  if (fullHash) {
    [prefix, hash] = fullHash.split('_');
    valid = (ADDRESS_TYPES[prefix] && HASH_REGEX.test(hash)) || isName;
  }

  return {
    valid,
    isName,
    prefix,
    hash,
  };
}

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
  return valid && prefix === HASH_PREFIX_CONTRACT;
}

export function isAensName(fullHash: string) {
  const { valid, prefix } = validateHash(fullHash);
  return valid && prefix === HASH_PREFIX_NAME;
}

export function checkAddress(value: string) {
  return (
    Crypto.isAddressValid(value, 'ak')
    || Crypto.isAddressValid(value, 'ct')
    || Crypto.isAddressValid(value, 'ok')
  );
}

export function checkAddressOrChannel(value: string) {
  return checkAddress(value) || Crypto.isAddressValid(value, 'ch');
}

export function checkAensName(value: string) {
  return (
    value.length <= AENS_NAME_MAX_LENGTH
    && /^[\p{L}\d]+\.chain$/gu.test(value)
  );
}

export function escapeSpecialChars(str = '') {
  return str.replace(/(\r\n|\n|\r|\n\r)/gm, ' ').replace(/"/g, '');
}

export function secondsToRelativeTime(seconds: number) {
  const { t } = useI18n();
  const secondsPerMinute = 60;
  const secondsPerHour = secondsPerMinute * 60;
  const secondsPerDay = secondsPerHour * 24;
  if (seconds < secondsPerMinute) {
    return t('common.seconds', Math.round(seconds));
  }
  if (seconds < secondsPerHour) {
    return t('common.minutes', Math.round(seconds / secondsPerMinute));
  }
  if (seconds < secondsPerDay) {
    return t('common.hours', Math.round(seconds / secondsPerHour));
  }
  return t('common.days', Math.round(seconds / secondsPerDay));
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

export function splitAddress(address: string | null): string {
  return address
    ? address.match(/.{1,3}/g)!.reduce((acc, current) => `${acc} ${current}`)
    : '';
}

export function relativeTimeTo(date: string): string {
  return dayjs().to(dayjs(date));
}

export function calculateFee(
  type: typeof SCHEMA.TX_TYPE,
  params: object = {},
): BigNumber {
  const minFee = TxBuilder.calculateMinFee(type, {
    params: {
      ...(type === 'spendTx' ? {
        senderId: STUB_ADDRESS,
        recipientId: STUB_ADDRESS,
      } : {}),
      amount: MAX_UINT256,
      ttl: MAX_UINT256,
      nonce: MAX_UINT256,
      ctVersion: {
        abiVersion: SCHEMA.ABI_VERSIONS.SOPHIA,
        vmVersion: SCHEMA.VM_VERSIONS.SOPHIA,
      },
      abiVersion: SCHEMA.ABI_VERSIONS.SOPHIA,
      callData: STUB_CALLDATA,
      gas: 0,
      ...params,
    },
    ...(type === 'nameClaimTx') ? { vsn: SCHEMA.VSN_2 } : {},
  });
  return new BigNumber(minFee).shiftedBy(-AETERNITY_COIN_PRECISION);
}

export function calculateNameClaimFee(name: string): BigNumber {
  return calculateFee(SCHEMA.TX_TYPE.nameClaim, {
    accountId: STUB_ADDRESS,
    name,
    nameSalt: Crypto.salt(),
    nameFee: TxBuilderHelper.getMinimumNameFee(name),
    nonce: STUB_NONCE,
    ttl: SCHEMA.NAME_TTL,
  });
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

export function postJson(url: string, options?: IRequestInitBodyParsed) {
  return fetchJson(url, {
    method: 'post',
    headers: { 'Content-Type': 'application/json' },
    ...options,
    body: options?.body && JSON.stringify(options.body),
  });
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

export function compareCaseInsensitive(str1?: string, str2?: string) {
  return str1?.toLocaleLowerCase() === str2?.toLocaleLowerCase();
}

export function includesCaseInsensitive(
  baseString: string,
  searchString: string,
) {
  return baseString?.toLocaleLowerCase().includes(searchString?.toLocaleLowerCase());
}

export function categorizeContractCallTxObject(transaction: ITransaction | IPendingTransaction): {
  amount?: string | number
  to?: string
  token?: string
  url?: string
  note?: string
} | null {
  if (!compareCaseInsensitive(transaction.tx.type, SCHEMA.TX_TYPE.contractCall)) {
    return null;
  }
  if (transaction.incomplete || transaction.pending) {
    const { tx } = transaction as IPendingTransaction;
    return {
      amount: tx.amount,
      token: tx.selectedTokenContractId ?? tx.contractId,
      to: transaction.incomplete ? tx.recipientId : tx.callerId,
    };
  }
  const { tx } = transaction as ITransaction;
  switch (tx.function) {
    case 'transfer':
    case 'transfer_payload':
    case 'change_allowance':
    case 'create_allowance':
      return {
        to: tx.arguments[0].value,
        amount: tx.arguments[1].value,
        token: tx.contractId,
      };
    case 'tip_token':
      return {
        url: tx.arguments[0].value,
        note: tx.arguments[1].value,
        amount: tx.arguments[3].value,
        token: tx.arguments[2].value,
      };
    case 'retip_token':
      return {
        url: tx.arguments[0].value,
        amount: tx.arguments[2].value,
        token: tx.arguments[1].value,
      };
    default:
      return null;
  }
}

/**
 * Prepare human-readable name from the user account object.
 * Eg.: `somehuman.chain`, `Account 2`
 */
export function getAccountNameToDisplay(acc: IAccount | undefined) {
  return (
    // @ts-ignore - type coming from VueI18n is excessively deep and possibly infinite
    acc?.name || `${i18n.global.t('pages.account.heading')} ${(acc?.idx || 0) + 1}`
  );
}

export function sortTransactionsByDateCallback(
  a: ICommonTransaction,
  b: ICommonTransaction,
) {
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
}

export function truncateString(text: string, maxLength: number) {
  return (text?.length)
    ? `${String(text).substring(0, maxLength)}${text.length > maxLength ? '...' : ''}`
    : '';
}

export function amountRounded(rawAmount: number | BigNumberPublic): string {
  let amount = rawAmount;
  if (typeof rawAmount !== 'object') {
    amount = new BigNumber(rawAmount);
  }

  if (new BigNumber(amount).lt(0.01) && amount.toString().length < 9 + 2) {
    return amount.toFixed();
  }
  return amount.toFixed(new BigNumber(amount).lt(0.01) ? 9 : 2);
}

export function getTxType(tx: ITx): TxType {
  return (
    TX_TYPE_MDW[tx.type]
    || (tx.tag && SCHEMA.OBJECT_ID_TX_TYPE[tx.tag])
    || (Object.values(SCHEMA.TX_TYPE).includes(tx.type) && tx.type)
  );
}

export function isTransactionAex9(transaction: ITransaction): boolean {
  const token = categorizeContractCallTxObject(transaction)?.token;
  return !!transaction.tx && !!token && token !== AETERNITY_CONTRACT_ID;
}

export function isContainingNestedTx(tx: ITx): boolean {
  return [
    TX_TYPE_MDW.GAMetaTx,
    TX_TYPE_MDW.PayingForTx,
  ].includes(
    getTxType(tx),
  );
}

export function getInnerTransaction(tx?: ITx): any {
  if (!tx) {
    return null;
  }

  return isContainingNestedTx(tx) ? tx.tx?.tx : tx;
}

export function getTransactionTipUrl(transaction: ITransaction): string {
  return (
    transaction.tipUrl
    || transaction.url
    || (
      !transaction.pending
      && !transaction.claim
      && transaction.tx.log?.[0]
      && transaction.tx?.function
      && includes(
        [TX_FUNCTIONS.tip, TX_FUNCTIONS.claim],
        transaction.tx.function,
      )
      && TxBuilderHelper.decode(transaction.tx.log[0].data).toString())
    || categorizeContractCallTxObject(transaction)?.url
    || ''
  );
}

export function aeToAettos(value: number | string) {
  return AmountFormatter.formatAmount(value.toString(), {
    denomination: AmountFormatter.AE_AMOUNT_FORMATS.AE,
    targetDenomination: AmountFormatter.AE_AMOUNT_FORMATS.AETTOS,
  });
}

export function aettosToAe(value: number | string) {
  return AmountFormatter.formatAmount(value.toString(), {
    denomination: AmountFormatter.AE_AMOUNT_FORMATS.AETTOS,
    targetDenomination: AmountFormatter.AE_AMOUNT_FORMATS.AE,
  });
}

/**
 * Converts long raw values like '3280000000000000000' to human-readable 3.28
 */
export function getAeFee(value: number | string) {
  return +aettosToAe(new BigNumber(value || 0).toNumber());
}

export function calculateSupplyAmount(balance: number, totalSupply: number, reserve: number) {
  if (!balance || !totalSupply || !reserve) {
    return null;
  }
  const share = new BigNumber(balance).times(100).div(totalSupply);
  const amount = new BigNumber(reserve).times(share).div(100);
  return amount.toFixed(0);
}

export function openInNewWindow(url: string) {
  window.open(url, '_blank');
}

export async function readValueFromClipboard(): Promise<string | undefined> {
  if (!process.env.UNFINISHED_FEATURES) {
    return undefined;
  }
  let value = '';

  if (IS_IONIC) {
    value = await new Promise((...args) => window.cordova!.plugins!.clipboard.paste(...args));
  } else if (IS_EXTENSION) {
    value = await browser!.runtime.sendMessage({ method: 'paste' });
  } else {
    try {
      value = await navigator.clipboard.readText();
    } catch (e: any) {
      if (!e.message.includes('Read permission denied.')) {
        handleUnknownError(e);
      }
    }
  }
  return value;
}

export function getHdWalletAccount(wallet: IWallet, accountIdx = 0) {
  const keyPair = getKeyPair(derivePathFromKey(`${accountIdx}h/0h/0h`, wallet).privateKey);
  return {
    ...keyPair,
    idx: accountIdx,
    address: TxBuilderHelper.encode(keyPair.publicKey, 'ak'),
  };
}

export function getTwitterAccountUrl(url: string) {
  const match = url.match(/https:\/\/twitter.com\/[a-zA-Z0-9_]+/g);
  return match ? match[0] : false;
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

export function isTxOfASupportedType(encodedTx: string, isTxBase64 = false) {
  let txToUnpack: string | Uint8Array = encodedTx;
  try {
    if (isTxBase64) {
      txToUnpack = new Uint8Array(TxBuilderHelper.decode(encodedTx, 'tx'));
    }
    const txObject = TxBuilder.unpackTx(txToUnpack, true).tx;
    return SUPPORTED_TX_TYPES.includes(SCHEMA.OBJECT_ID_TX_TYPE[txObject.tag]);
  } catch (e) {
    return false;
  }
}

export function isTxDex(tx?: ITx, dexContracts?: IDexContracts) {
  const { wae = [], router = [] } = dexContracts || {};

  return !!(
    tx
    && tx.contractId
    && tx.function
    && Object.values(FUNCTION_TYPE_DEX).flat().includes(tx.function as TxFunctionRaw)
    && [...wae, ...router].includes(tx.contractId)
  );
}

export function getTxOwnerAddress(innerTx?: ITx) {
  return innerTx?.accountId || innerTx?.callerId;
}

export function getOwnershipStatus(
  activeAccount: IAccount,
  accounts: IAccount[],
  innerTx?: ITx,
) {
  const txOwnerAddress = getTxOwnerAddress(innerTx);
  if (activeAccount.address === txOwnerAddress) {
    return TRANSACTION_OWNERSHIP_STATUS.current;
  }
  if (accounts.find(({ address }) => address === txOwnerAddress)) {
    return TRANSACTION_OWNERSHIP_STATUS.subAccount;
  }
  return TRANSACTION_OWNERSHIP_STATUS.other;
}

export function errorHasValidationKey(error: any, expectedKey: string) {
  return (
    error.validation
    && error.validation.some(({ key }: any) => expectedKey === key)
  );
}

export function isInsufficientBalanceError(error: any) {
  return (
    error instanceof InvalidTxError
    && errorHasValidationKey(error, 'InsufficientBalance')
  );
}

export function getTransaction(transaction: ICommonTransaction): ITransaction | undefined {
  return (transaction as any).isMultisigTransaction
    ? undefined
    : transaction as ITransaction;
}

export function getMultisigTransaction(
  transaction: ICommonTransaction,
): IActiveMultisigTransaction | undefined {
  return (transaction as any).isMultisigTransaction
    ? transaction as IActiveMultisigTransaction
    : undefined;
}

/**
 * Check if the image is available by making a HEAD request.
 * Needed for Cordova because when using <img /> tag and the image is not available
 * the DOM ready event is not fired.
 */
export function checkImageAvailability(url: string): Promise<boolean> {
  // TODO: use  { method: 'HEAD'} when backend will introduce a proper response in such case
  return fetch(url)
    .then((response) => !!response.ok)
    .catch(() => false);
}
