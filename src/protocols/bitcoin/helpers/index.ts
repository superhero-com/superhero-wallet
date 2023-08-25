import { BTC_COIN_PRECISION } from '../config';

export function satoshiToBtc(amount: number) {
  return amount / 10 ** BTC_COIN_PRECISION;
}

export function normalizeTransactionStructure(
  transaction: any,
  transactionOwner?: string,
): any {
  return {
    transactionOwner,
    hash: transaction.txid, // TODO: we can go with additional field
    microTime: transaction.status.block_time,
    pending: !transaction.status.confirmed,
    tx: {
      amount: transaction.vout[0].value,
      fee: transaction.fee,
      senderId: transaction.vin[0].prevout.scriptpubkey_address,
      recipientId: transaction.vout[0].scriptpubkey_address,
      type: 'SpendTx', // TODO: create own types
    },
  };
}
