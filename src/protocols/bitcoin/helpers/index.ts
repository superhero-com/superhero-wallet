import type { ITransaction } from '@/types';
import { PROTOCOLS } from '@/constants';
import { BTC_COIN_PRECISION, BTC_CONTRACT_ID } from '../config';

export function satoshiToBtc(amount: number) {
  return amount / 10 ** BTC_COIN_PRECISION;
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

  /**
   * In case the transaction consists out of two elements:
   * 1) Sending to a recipient
   * 2) Resending the rest to a sender's subaccount
   * our current transaction overview logic will show only one of them.
   * This means that if user decides to view transaction information
   * not related to the transactionOwner using our wallet,
   * we will not be able to show the correct information.
   * TODO: show ALL the transaction info
   */

  const amountInSatochi = (
    transactionOwner === vout[0].scriptpubkey_address
    || vout.length === 1
  ) ? vout[0].value : vout[1].value;
  const recipientId = (
    transactionOwner === vout[0].scriptpubkey_address
    || vout.length === 1
  )
    ? vout[0].scriptpubkey_address
    : vout[1].scriptpubkey_address;

  return {
    protocol: PROTOCOLS.bitcoin,
    transactionOwner: transactionOwner as any,
    hash: txid, // TODO: we can go with additional field
    blockHeight: status.block_height,
    microTime: status.block_time * 1000,
    pending: !status.confirmed,
    tx: {
      amount: satoshiToBtc(amountInSatochi),
      fee: satoshiToBtc(fee),
      senderId: vin[0].prevout.scriptpubkey_address,
      recipientId,
      type: 'SpendTx', // TODO: create own types
      arguments: [],
      callerId: '' as any,
      contractId: BTC_CONTRACT_ID as any,
    },
  };
}
