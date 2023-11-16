import { fromWei, toChecksumAddress, toWei } from 'web3-utils';
import { getBlock, getTransaction } from 'web3-eth';
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

export function normalizeEtherscanTransactionStructure(
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

export function normalizeWeb3EthTransactionStructure(
  transaction?: Awaited<ReturnType<typeof getTransaction>> & { gasPrice?: string },
  block?: Awaited<ReturnType<typeof getBlock>>,
): ITransaction {
  const {
    blockNumber,
    from,
    hash,
    gas,
    gasPrice,
    to,
    value,
    type,
  } = transaction || {};
  const { timestamp } = block || {};
  const isLegacy = (Number(type) === 0); // e.g.: faucet

  return {
    protocol: PROTOCOLS.ethereum,
    hash: hash as any,
    microTime: timestamp ? new Date(Number(timestamp) * 1000).getTime() : undefined,
    pending: false,
    blockHeight: Number(blockNumber),
    tx: {
      amount: Number(fromWei(value || 0, 'ether')),
      fee: (!isLegacy) ? +fromWei(Number(gas || 0) * Number(gasPrice || 0), 'ether') : 0,
      senderId: from ? toChecksumAddress(from) as any : undefined,
      recipientId: to ? toChecksumAddress(to) as any : undefined,
      type: 'SpendTx', // TODO: create own types
      arguments: [],
      callerId: '' as any,
      contractId: ETH_CONTRACT_ID as any,
    },
  };
}
