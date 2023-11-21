import { fromWei, toChecksumAddress, toWei } from 'web3-utils';
import BigNumber from 'bignumber.js';
import { ITransaction } from '@/types';
import { PROTOCOLS } from '@/constants';
import { ETH_CONTRACT_ID, ETH_SAFE_CONFIRMATION_COUNT } from '../config';

/**
 * Convert Gwei to Ether
 */
export function etherFromGwei(gwei: number) {
  return new BigNumber(fromWei(toWei(gwei, 'gwei'), 'ether'));
}

export function normalizeTransactionStructure(
  transaction: any,
  transactionOwner?: string,
): ITransaction {
  const {
    hash,
    value,
    gasUsed,
    gasPrice,
    confirmations,
    to,
    from,
    timeStamp,
  } = transaction;

  const senderId = toChecksumAddress(from) as any;
  const recipientId = toChecksumAddress(to) as any;
  const fee = gasUsed * Number(fromWei(gasPrice, 'ether'));
  const amount = Number(fromWei(value, 'ether'));
  const pending = parseInt(confirmations, 10) <= ETH_SAFE_CONFIRMATION_COUNT;
  const microTime = timeStamp * 1000;
  return {
    protocol: PROTOCOLS.ethereum,
    transactionOwner: transactionOwner as any,
    hash,
    microTime,
    pending,
    tx: {
      amount,
      fee,
      senderId,
      recipientId,
      type: 'SpendTx', // TODO: create own types
      arguments: [],
      callerId: '' as any,
      contractId: ETH_CONTRACT_ID as any,
    },
  };
}
