import BigNumber from 'bignumber.js';
import type { ITransaction } from '@/types';
import { PROTOCOLS } from '@/constants';
import { BTC_COIN_PRECISION, BTC_CONTRACT_ID } from '../config';

export function satoshiToBtc(amount: number) {
  return amount / 10 ** BTC_COIN_PRECISION;
}

// TODO Duplicate in fungibleTokens.ts composable
export function getTxAmountTotal(transaction: ITransaction, isReceived: boolean): number {
  return new BigNumber(
    transaction.tx?.amount || 0,
  )
    .plus(isReceived ? 0 : transaction.tx?.fee || 0)
    .toNumber();
}

export function normalizeTransactionStructure(
  transaction: any,
  transactionOwner?: string,
): ITransaction {
  const {
    fee,
    status,
    txid,
    vin,
    vout,
  } = transaction;

  return {
    protocol: PROTOCOLS.bitcoin,
    transactionOwner: transactionOwner as any,
    hash: txid, // TODO: we can go with additional field
    blockHeight: status.block_height,
    microTime: status.block_time * 1000,
    pending: !status.confirmed,
    tx: {
      amount: satoshiToBtc(vout[0].value),
      fee: satoshiToBtc(fee),
      senderId: vin[0].prevout.scriptpubkey_address,
      recipientId: vout[0].scriptpubkey_address,
      type: 'SpendTx', // TODO: create own types
      arguments: [],
      callerId: '' as any,
      contractId: BTC_CONTRACT_ID as any,
    },
  };
}
