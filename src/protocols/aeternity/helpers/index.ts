import {
  AE_AMOUNT_FORMATS,
  Encoded,
  Tag,
  decode,
  formatAmount,
  unpackTx,
} from '@aeternity/aepp-sdk';
import BigNumber from 'bignumber.js';

import type {
  IDexContracts,
  ITransaction,
  ITx,
  TxFunction,
  TxFunctionRaw,
  TxType,
} from '@/types';
import { compareCaseInsensitive, includes } from '@/utils';
import {
  AE_AENS_NAME_MAX_LENGTH,
  AE_CONTRACT_ID,
  AE_SIMPLEX_URL,
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

export function categorizeContractCallTxObject(transaction: ITransaction): {
  amount?: string | number
  to?: string
  token?: string
  url?: string
  note?: string
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

/**
 * Converts long raw values like '3280000000000000000' to human-readable 3.28
 */
export function getAeFee(value: number | string) {
  return +aettosToAe(new BigNumber(value || 0).toNumber());
}

export function isContainingNestedTx(tx: ITx): boolean {
  return [
    'GAMetaTx', // aeSdk: GaMetaTx, mdw: GAMetaTx
    Tag[Tag.GaMetaTx],
    Tag[Tag.PayingForTx],
  ].includes(tx.type);
}

export function isTxOfASupportedType(encodedTx: Encoded.Transaction) {
  try {
    const txObject = unpackTx(encodedTx);
    return TX_TAGS_SUPPORTED.includes(txObject.tag);
  } catch (e) {
    return false;
  }
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
