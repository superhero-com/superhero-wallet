import { camelCase, snakeCase } from 'lodash-es';
import {
  AE_AMOUNT_FORMATS,
  Encoded,
  Encoding,
  InvalidTxError,
  MemoryAccount,
  TransactionError,
  Tag,
  buildTx,
  decode,
  encode,
  formatAmount,
  getTransactionSignerAddress,
  isAddressValid,
  unpackTx,
} from '@aeternity/aepp-sdk';
import type { Node } from '@aeternity/aepp-sdk';
import BigNumber from 'bignumber.js';

import type {
  AccountAddress,
  AssetContractId,
  IAccount,
  IActiveMultisigTransaction,
  ICommonTransaction,
  IDexContracts,
  IGAAttachTx,
  IMultisigAccount,
  ITransaction,
  ITx,
  TxFunction,
  TxFunctionParsed,
  TxFunctionRaw,
  TxType,
} from '@/types';
import { HASH_REGEX, PROTOCOLS, TX_DIRECTION } from '@/constants';
import {
  compareCaseInsensitive,
  errorHasValidationKey,
  includes,
  isNotFoundError,
} from '@/utils';
import {
  ACTIVITIES_TYPES,
  AE_AENS_DOMAIN,
  AE_CONTRACT_ID,
  AE_FAUCET_URL,
  AE_HASH_PREFIXES_ALLOWED,
  AE_SIMPLEX_URL,
  AE_TRANSACTION_OWNERSHIP_STATUS,
  SEED_LENGTH,
  TX_FUNCTIONS,
  TX_FUNCTIONS_TYPE_DEX,
  TX_TAGS_SUPPORTED,
} from '../config';

export * from './transactionTokenInfoResolvers';

export function aeToAettos(value: number | string | BigNumber) {
  return formatAmount(value.toString(), {
    denomination: AE_AMOUNT_FORMATS.AE,
    targetDenomination: AE_AMOUNT_FORMATS.AETTOS,
  });
}

export function aettosToAe(value: number | string | BigNumber) {
  return formatAmount(value.toString(), {
    denomination: AE_AMOUNT_FORMATS.AETTOS,
    targetDenomination: AE_AMOUNT_FORMATS.AE,
  });
}

export function buildAeFaucetUrl(address: string): string {
  return `${AE_FAUCET_URL}?address=${address}`;
}

export function buildSimplexLink(address: string): string {
  const link = new URL(AE_SIMPLEX_URL);
  link.searchParams.set('wallet_address', address);
  return link.toString();
}

export function calculateSupplyAmount(balance: number, totalSupply: number, reserve: number) {
  if (!balance || !totalSupply || !reserve) {
    return undefined;
  }
  const share = new BigNumber(balance).times(100).div(totalSupply);
  const amount = new BigNumber(reserve).times(share).div(100);
  return amount.toFixed(0);
}

export function categorizeContractCallTxObject(transaction: ITransaction): {
  amount: number;
  assetContractId: AssetContractId;
  to?: string;
  url?: string;
  note?: string;
} | null {
  const { tx, incomplete, pending } = transaction || {};
  if (!compareCaseInsensitive(tx.type, Tag[Tag.ContractCallTx])) {
    return null;
  }

  if (incomplete || pending) {
    return {
      amount: tx.amount,
      assetContractId: tx.selectedTokenContractId ?? tx.contractId,
      to: incomplete ? tx.recipientId : tx.callerId,
    };
  }

  // TODO Consider picking the argument by the `type` value instead of the array index value.
  const txArgValues = (tx.arguments || []).map((arg) => arg.value);

  switch (tx.function) {
    case TX_FUNCTIONS.transfer:
    case TX_FUNCTIONS.transferPayload:
    case TX_FUNCTIONS.changeAllowance:
    case TX_FUNCTIONS.createAllowance:
      return {
        to: txArgValues[0],
        amount: txArgValues[1],
        assetContractId: tx.contractId,
      };
    case TX_FUNCTIONS.tipToken:
      return {
        url: txArgValues[0],
        note: txArgValues[1],
        amount: txArgValues[3],
        assetContractId: txArgValues[2],
      };
    case TX_FUNCTIONS.retipToken:
      return {
        url: txArgValues[0],
        amount: txArgValues[2],
        assetContractId: txArgValues[1],
      };
    default:
      return null;
  }
}

export function getTokenSaleBuyAmount(tx: ITx) {
  const refundEvent = tx?.internalEvents
    ?.find(({ type }) => ACTIVITIES_TYPES.internalContractCallEvent === type);

  return (
    refundEvent && refundEvent.payload.internalTx.recipientId === tx.callerId
  )
    ? tx.amount - refundEvent.payload.internalTx.amount
    : tx.amount;
}

/**
 * As there is no UI element that displays multisig account index we can use the 0 as the idx values
 * to only satisfy the requirements of the interface.
 */
export function convertMultisigAccountToAccount(
  multisigAccount: IMultisigAccount,
): Partial<IAccount> {
  return {
    address: multisigAccount.gaAccountId,
    protocol: PROTOCOLS.aeternity,
    idx: 0,
    globalIdx: 0,
  };
}

type NameEntry = Awaited<ReturnType<InstanceType<typeof Node>['getNameEntryByName']>>;

export function getAddressByNameEntry(nameEntry: NameEntry, pointer = 'account_pubkey') {
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

/**
 * TODO: Update returned type
 */
export function getInnerTransaction(tx?: ITx): any {
  if (!tx) {
    return undefined;
  }
  if (isContainingNestedTx(tx)) {
    return tx.tx?.tx;
  }
  return tx;
}

export function getMultisigTransaction(
  transaction: ICommonTransaction,
): IActiveMultisigTransaction | undefined {
  return (transaction.isMultisig)
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
  return (transaction.isMultisig)
    ? undefined
    : transaction as ITransaction;
}

export function getTransactionPayload(transaction: ITransaction) {
  const innerTx = getInnerTransaction(transaction.tx);
  return (innerTx?.payload)
    ? decode(innerTx?.payload).toString()
    : null;
}

export function getTransactionTipUrl(transaction: ITransaction): string {
  return (
    transaction.tipUrl
    || transaction.url
    || (
      !transaction.pending
      && transaction.tx.log?.[0]
      && transaction.tx?.function
      && includes(
        [TX_FUNCTIONS.tip, TX_FUNCTIONS.claim],
        transaction.tx.function,
      )
      && decode(transaction.tx.log[0].data as Encoded.ContractBytearray).toString()
    )
    || ''
  );
}

export function getTxDirection(tx?: ITx | IGAAttachTx, address?: AccountAddress) {
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

export function getTxTag({ tag, type }: ITx = {} as any): Tag | null {
  if (tag) {
    return tag;
  }
  if (compareCaseInsensitive(type, 'GAAttachTx')) { // aeSdk: GaAttachTx, mdw: GAAttachTx
    return Tag.GaAttachTx;
  }
  if (compareCaseInsensitive(type, 'GAMetaTx')) { // aeSdk: GaMetaTx, mdw: GAMetaTx
    return Tag.GaMetaTx;
  }
  if (type in Tag) {
    return Tag[type as TxType];
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

/**
 * Check if transaction does not refers to AE Coin.
 */
export function isTransactionAex9(transaction: ITransaction): boolean {
  const contractId = categorizeContractCallTxObject(transaction)?.assetContractId;
  return !!transaction.tx && !!contractId && contractId !== AE_CONTRACT_ID;
}

export function isTxDex(tx?: ITx, dexContracts?: IDexContracts) {
  const { wae = [], router = [] } = dexContracts || {};

  return !!(
    tx?.contractId
    && tx?.function
    && Object.values(TX_FUNCTIONS_TYPE_DEX).flat().includes(tx.function as TxFunctionRaw)
    && [...wae, ...router].includes(tx.contractId as Encoded.ContractAddress)
  );
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
    encode(secretKey.subarray(0, SEED_LENGTH), Encoding.AccountSecretKey),
  );
}

/**
 * Parse any type of transaction function name to camelCase (parsed)
 */
export function getTxFunctionParsed(functionName?: TxFunction) {
  return functionName ? camelCase(functionName) as TxFunctionParsed : undefined;
}

/**
 * Parse any type of transaction function name to snake_case (raw)
 */
export function getTxFunctionRaw(functionName?: TxFunction) {
  return functionName ? snakeCase(functionName) as TxFunctionRaw : undefined;
}

/**
 * Find the field holding the address that has to sign the transaction.
 *
 * Every signable transaction names its signer in a different field (`senderId`
 * on a SpendTx, `callerId` on a ContractCallTx, `ownerId` on a ContractCreateTx,
 * `accountId` on the name transactions, ...). The SDK resolves it from the
 * transaction schema, but does not expose that lookup, so instead of keeping a
 * hand-written tag-to-field map in sync we locate the field by its value: it is
 * the one holding the address the SDK reports as the signer.
 *
 * Transactions whose signer is bound to an identity rather than a plain account
 * (an oracle, addressed as `ok_...`) have no such field and cannot be re-pointed
 * at a different account.
 */
function getTransactionSignerKey(
  txParams: Record<string, any>,
  signerAddress: string,
): string | undefined {
  return Object.keys(txParams).find((key) => txParams[key] === signerAddress);
}

/**
 * Whether the transaction's sender can be re-pointed at a different account.
 */
export function canRebuildTransactionForSigner(txBase64: Encoded.Transaction): boolean {
  try {
    const txParams = unpackTx(txBase64) as unknown as Record<string, any>;
    // A signed (or generalized-account) transaction is not ours to re-point.
    if (txParams.tag === Tag.SignedTx || txParams.tag === Tag.GaMetaTx) {
      return false;
    }
    return !!getTransactionSignerKey(txParams, getTransactionSignerAddress(txBase64));
  } catch {
    return false;
  }
}

/**
 * Rebuild a transaction so that it is sent by `signerAddress` instead of the
 * account it was originally prepared for.
 *
 * The sender is part of the transaction, so a signature from any other account
 * is rejected by the node. When the user deliberately picks a different account
 * to sign with, the transaction has to be re-pointed at it and given a nonce
 * valid for that account.
 *
 * Throws rather than returning a transaction that would still be signed by
 * somebody else - a silently unchanged sender would produce a signature the
 * node discards.
 */
export async function rebuildTransactionForSigner(
  txBase64: Encoded.Transaction,
  signerAddress: Encoded.AccountAddress,
  fetchNextNonce: (address: Encoded.AccountAddress) => Promise<number>,
): Promise<Encoded.Transaction> {
  const txParams = unpackTx(txBase64) as unknown as Record<string, any>;
  const signerKey = getTransactionSignerKey(txParams, getTransactionSignerAddress(txBase64));

  if (!signerKey) {
    throw new TransactionError(`Cannot re-point ${Tag[txParams.tag]} at another account`);
  }

  txParams[signerKey] = signerAddress;
  txParams.nonce = await fetchNextNonce(signerAddress);

  const rebuiltTx = buildTx(txParams as any);

  if (getTransactionSignerAddress(rebuiltTx) !== signerAddress) {
    throw new TransactionError('Rebuilt transaction is still signed by another account');
  }

  return rebuiltTx;
}
