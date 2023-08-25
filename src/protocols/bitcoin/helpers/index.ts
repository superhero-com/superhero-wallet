import { toOutputScript } from 'bitcoinjs-lib/src/address';
import { networks } from 'bitcoinjs-lib';
import { BTC_COIN_PRECISION } from '../config';

export function satoshiToBtc(amount: number) {
  return amount / 10 ** BTC_COIN_PRECISION;
}

export function isBtcAddressValid(address: string, networkType: string) {
  try {
    const network = networks[networkType as keyof typeof networks];
    toOutputScript(address, network);
    return true;
  } catch (error) {
    return false;
  }
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
