import nacl from 'tweetnacl';
import {
  AE_AMOUNT_FORMATS,
  Encoded,
  Encoding,
  InvalidTxError,
  MemoryAccount,
  Tag,
  decode,
  formatAmount,
  isAddressValid,
  unpackTx,
} from '@aeternity/aepp-sdk';
import BigNumber from 'bignumber.js';

import type {
  IAccount,
  IActiveMultisigTransaction,
  ICommonTransaction,
  IDexContracts,
  IGAAttachTx,
  INameEntryFetched,
  ITransaction,
  ITx,
  TxFunction,
  TxFunctionRaw,
  TxType,
} from '@/types';
import { HASH_REGEX, TX_DIRECTION } from '@/constants';
import {
  compareCaseInsensitive,
  errorHasValidationKey,
  includes,
  isNotFoundError,
} from '@/utils';
import {
  AE_AENS_DOMAIN,
  AE_AENS_NAME_MAX_LENGTH,
  AE_CONTRACT_ID,
  AE_HASH_PREFIXES_ALLOWED,
  AE_SIMPLEX_URL,
  AE_TRANSACTION_OWNERSHIP_STATUS,
  SEED_LENGTH,
  TX_FUNCTIONS,
  TX_FUNCTIONS_TYPE_DEX,
  TX_TAGS_SUPPORTED,
} from '../config';

export * from './transactionTokenInfoResolvers';

export function buildSimplexLink(address: string) {
  const link = new URL(AE_SIMPLEX_URL);
  link.searchParams.set('wallet_address', address);
  return link.toString();
}

export function aeToAettos(value: number | string) {
  return formatAmount(value.toString(), {
    denomination: AE_AMOUNT_FORMATS.AE,
    targetDenomination: AE_AMOUNT_FORMATS.AETTOS,
  });
}

export function aettosToAe(value: number | string) {
  return formatAmount(value.toString(), {
    denomination: AE_AMOUNT_FORMATS.AETTOS,
    targetDenomination: AE_AMOUNT_FORMATS.AE,
  });
}

export function calculateSupplyAmount(balance: number, totalSupply: number, reserve: number) {
  if (!balance || !totalSupply || !reserve) {
    return null;
  }
  const share = new BigNumber(balance).times(100).div(totalSupply);
  const amount = new BigNumber(reserve).times(share).div(100);
  return amount.toFixed(0);
}

export function categorizeContractCallTxObject(transaction: ITransaction): {
  amount?: string | number;
  to?: string;
  token?: string;
  url?: string;
  note?: string;
} | null {
  if (!compareCaseInsensitive(transaction.tx.type, Tag[Tag.ContractCallTx])) {
    return null;
  }
  if (transaction.incomplete || transaction.pending) {
    const { tx } = transaction;
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

export function getAddressByNameEntry(nameEntry: INameEntryFetched, pointer = 'account_pubkey') {
  return ((nameEntry.pointers && nameEntry.pointers.find(({ key }) => key === pointer)) || {}).id;
}

/**
 * Converts long raw values like '3280000000000000000' to human-readable 3.28
 */
export function getAeFee(value: number | string) {
  return +aettosToAe(new BigNumber(value || 0).toNumber());
}

export function getTxOwnerAddress(innerTx?: ITx) {
  return innerTx?.accountId || innerTx?.callerId || innerTx?.ownerId;
}

export function isContainingNestedTx(tx: ITx): boolean {
  return [
    'GAMetaTx', // aeSdk: GaMetaTx, mdw: GAMetaTx
    Tag[Tag.GaMetaTx],
    Tag[Tag.PayingForTx],
  ].includes(tx.type);
}

export function getInnerTransaction(tx?: ITx): any {
  if (!tx) {
    return null;
  }
  if (isContainingNestedTx(tx)) {
    return tx.tx?.tx;
  }
  return tx;
}

export function getMultisigTransaction(
  transaction: ICommonTransaction,
): IActiveMultisigTransaction | undefined {
  return (transaction as any).isMultisigTransaction
    ? transaction as IActiveMultisigTransaction
    : undefined;
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

export function getTransaction(transaction: ICommonTransaction): ITransaction | undefined {
  return (transaction as any).isMultisigTransaction
    ? undefined
    : transaction as ITransaction;
}

export function getTransactionPayload(transaction: ITransaction) {
  return (transaction.tx?.payload)
    ? decode(transaction.tx?.payload).toString()
    : null;
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
      && decode(transaction.tx.log[0].data as Encoded.ContractBytearray).toString())
    || categorizeContractCallTxObject(transaction)?.url
    || ''
  );
}

export function getTxDirection(tx?: ITx | IGAAttachTx, address?: Encoded.AccountAddress) {
  type ICommonTx = ITx & IGAAttachTx; // All possible properties of the tx

  if ((tx as ITx)?.tag === Tag.SpendTx) {
    return (tx as ITx).senderId === address
      ? TX_DIRECTION.sent
      : TX_DIRECTION.received;
  }

  // Check if any of the properties that has an address-like value is equal to provided address
  const keysWithHashes: (keyof ICommonTx)[] = ['senderId', 'accountId', 'ownerId', 'callerId', 'payerId'];
  return (keysWithHashes.map((key) => (tx as ICommonTx)?.[key]).includes(address as never))
    ? TX_DIRECTION.sent
    : TX_DIRECTION.received;
}

export function getTxTag(tx: ITx): Tag | null {
  if (tx.tag) {
    return tx.tag;
  }
  if (compareCaseInsensitive(tx.type, 'GAAttachTx')) { // aeSdk: GaAttachTx, mdw: GAAttachTx
    return Tag.GaAttachTx;
  }
  if (compareCaseInsensitive(tx.type, 'GAMetaTx')) { // aeSdk: GaMetaTx, mdw: GAMetaTx
    return Tag.GaMetaTx;
  }
  if (tx.type in Tag) {
    return Tag[tx.type as TxType];
  }
  return null;
}

export function isAccountNotFoundError(error: any) {
  return isNotFoundError(error) && error?.response?.body?.reason === 'Account not found';
}

export function isInsufficientBalanceError(error: any) {
  return (
    error instanceof InvalidTxError
    && errorHasValidationKey(error, 'InsufficientBalance')
  );
}

export function isTxOfASupportedType(encodedTx: Encoded.Transaction) {
  try {
    const txObject = unpackTx(encodedTx);
    return TX_TAGS_SUPPORTED.includes(txObject.tag);
  } catch (e) {
    return false;
  }
}

export function isAensNameValid(value: string) {
  return (
    value.length <= AE_AENS_NAME_MAX_LENGTH
    && /^[\p{L}\d]+\.chain$/gu.test(value)
  );
}

export function isTransactionAex9(transaction: ITransaction): boolean {
  const token = categorizeContractCallTxObject(transaction)?.token;
  return !!transaction.tx && !!token && token !== AE_CONTRACT_ID;
}

export function isTxDex(tx?: ITx, dexContracts?: IDexContracts) {
  const { wae = [], router = [] } = dexContracts || {};

  return !!(
    tx
    && tx.contractId
    && tx.function
    && Object.values(TX_FUNCTIONS_TYPE_DEX).flat().includes(tx.function as TxFunctionRaw)
    && [...wae, ...router].includes(tx.contractId)
  );
}

export function isTxFunctionDexAllowance(txFunction?: TxFunction) {
  return !!txFunction && includes(TX_FUNCTIONS_TYPE_DEX.allowance, txFunction);
}

export function isTxFunctionDexSwap(txFunction?: TxFunction) {
  return !!txFunction && includes(TX_FUNCTIONS_TYPE_DEX.swap, txFunction);
}

export function isTxFunctionDexPool(txFunction?: TxFunction) {
  return !!txFunction && includes(TX_FUNCTIONS_TYPE_DEX.pool, txFunction);
}

export function isTxFunctionDexMaxSpent(txFunction?: TxFunction) {
  return !!txFunction && includes(TX_FUNCTIONS_TYPE_DEX.maxSpent, txFunction);
}

export function isTxFunctionDexMinReceived(txFunction?: TxFunction) {
  return !!txFunction && includes(TX_FUNCTIONS_TYPE_DEX.minReceived, txFunction);
}

export function isTxFunctionDexAddLiquidity(txFunction?: TxFunction) {
  return !!txFunction && includes(TX_FUNCTIONS_TYPE_DEX.addLiquidity, txFunction);
}

export function isTxFunctionDexRemoveLiquidity(txFunction?: TxFunction) {
  return !!txFunction && includes(TX_FUNCTIONS_TYPE_DEX.removeLiquidity, txFunction);
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

export function getAccountFromSecret(secretKey: Buffer) {
  // `secretKey` variable can be either seed or seed + public key (legacy)
  return new MemoryAccount(
    Buffer.from(secretKey).length === SEED_LENGTH
      ? nacl.sign.keyPair.fromSeed(Buffer.from(secretKey)).secretKey
      : Buffer.from(secretKey),
  );
}
