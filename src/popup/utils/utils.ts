import BigNumber from 'bignumber.js';
import {
  derivePathFromKey,
  encode,
  Encoding,
  getKeyPair,
  InvalidTxError,
  isAddressValid,
} from '@aeternity/aepp-sdk';
import { useI18n } from 'vue-i18n';
import type {
  IAccount,
  ITransaction,
  ITx,
  IDashboardTransaction,
  INameEntryFetched,
  IWallet,
  IActiveMultisigTransaction,
  ICommonTransaction,
} from '@/types';
import {
  AE_AENS_DOMAIN,
  AE_HASH_PREFIXES_ALLOWED,
  AE_TRANSACTION_OWNERSHIP_STATUS,
} from '@/protocols/aeternity/config';
import {
  HASH_REGEX,
  TX_DIRECTION,
} from '@/config';
import { tg } from '@/store/plugins/languages';

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

export function getAddressByNameEntry(nameEntry: INameEntryFetched, pointer = 'account_pubkey') {
  return ((nameEntry.pointers && nameEntry.pointers.find(({ key }) => key === pointer)) || {}).id;
}

export function validateHash(fullHash?: string) {
  type HashPrefix = typeof AE_HASH_PREFIXES_ALLOWED[number];
  const isName = !!fullHash?.endsWith(AE_AENS_DOMAIN);
  let valid = false;
  let prefix: HashPrefix | null = null;
  let hash = null;

  if (fullHash) {
    [prefix, hash] = fullHash.split('_') as [HashPrefix, string];
    valid = (AE_HASH_PREFIXES_ALLOWED.includes(prefix) && HASH_REGEX.test(hash)) || isName;
  }

  return {
    valid,
    isName,
    prefix,
    hash,
  };
}

export function isContract(fullHash: string) {
  const { valid, prefix } = validateHash(fullHash);
  return valid && prefix === Encoding.ContractAddress;
}

export function isAensName(fullHash: string) {
  const { valid, prefix } = validateHash(fullHash);
  return valid && prefix === Encoding.Name;
}

export function checkAddress(value: string) {
  return (
    isAddressValid(value, Encoding.AccountAddress)
    || isAddressValid(value, Encoding.ContractAddress)
    || isAddressValid(value, Encoding.OracleAddress)
  );
}

export function checkAddressOrChannel(value: string) {
  return checkAddress(value) || isAddressValid(value, Encoding.Channel);
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

export function splitAddress(address: string | null): string {
  return address
    ? address.match(/.{1,3}/g)!.reduce((acc, current) => `${acc} ${current}`)
    : '';
}

/**
 * Prepare human-readable name from the user account object.
 * Eg.: `somehuman.chain`, `Account 2`
 */
export function getAccountNameToDisplay(acc: IAccount | undefined) {
  return acc?.name || `${tg('pages.account.heading')} ${(acc?.idx || 0) + 1}`;
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

export function calculateSupplyAmount(balance: number, totalSupply: number, reserve: number) {
  if (!balance || !totalSupply || !reserve) {
    return null;
  }
  const share = new BigNumber(balance).times(100).div(totalSupply);
  const amount = new BigNumber(reserve).times(share).div(100);
  return amount.toFixed(0);
}

export function getHdWalletAccount(wallet: IWallet, accountIdx = 0) {
  const keyPair = getKeyPair(derivePathFromKey(`${accountIdx}h/0h/0h`, { ...wallet, secretKey: wallet.privateKey }).secretKey);
  return {
    ...keyPair,
    idx: accountIdx,
    address: encode(keyPair.publicKey, Encoding.AccountAddress),
  };
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
    return AE_TRANSACTION_OWNERSHIP_STATUS.current;
  }
  if (accounts.find(({ address }) => address === txOwnerAddress)) {
    return AE_TRANSACTION_OWNERSHIP_STATUS.subAccount;
  }
  return AE_TRANSACTION_OWNERSHIP_STATUS.other;
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
