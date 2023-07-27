import type { ITransaction } from '@/types';
import { categorizeContractCallTxObject } from '@/popup/utils';
import {
  AE_CONTRACT_ID,
  AE_SIMPLEX_URL,
} from './config';

export function isTransactionAex9(transaction: ITransaction): boolean {
  const token = categorizeContractCallTxObject(transaction)?.token;
  return !!transaction.tx && !!token && token !== AE_CONTRACT_ID;
}

export function buildSimplexLink(address: string) {
  const link = new URL(AE_SIMPLEX_URL);
  link.searchParams.set('wallet_address', address);
  return link.toString();
}
