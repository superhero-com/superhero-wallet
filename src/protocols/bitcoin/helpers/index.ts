import type { ITransaction } from '@/types';
import { PROTOCOLS } from '@/constants';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';
import { fetchJson } from '@/utils';
import { BTC_COIN_PRECISION } from '../config';

interface IUtxo {
  txid: string;
  vout: number;
  value: number;
}

export function satoshiToBtc(amount: number) {
  return amount / 10 ** BTC_COIN_PRECISION;
}

export const sumValues = (
  items: { value: number }[],
) => items.reduce((sum, { value }) => sum + value, 0);

/** All the unspent transaction outputs of `address`, confirmed or not */
export async function fetchUtxoList(nodeUrl: string, address: string): Promise<IUtxo[]> {
  const utxos = await fetchJson(`${nodeUrl}/address/${address}/utxo`);
  if (!Array.isArray(utxos)) {
    throw new Error('Unexpected UTXO response');
  }
  return utxos;
}

/** Signing needs the raw transaction of each UTXO spent. */
export async function fetchUtxoTransactions<T extends IUtxo>(nodeUrl: string, utxos: T[]) {
  return Promise.all(utxos.map(async (utxo) => {
    const response = await fetch(`${nodeUrl}/tx/${utxo.txid}/hex`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} fetching the transaction of a UTXO`);
    }
    return { ...utxo, transactionInHex: await response.text() };
  }));
}

/**
 * Picks the smallest UTXO that covers `targetValue` alone, else the largest ones first.
 * Returns all of them when they are not enough.
 */
export function selectUtxos<T extends { value: number }>(utxos: T[], targetValue: number): T[] {
  const [smallestSufficient] = utxos
    .filter(({ value }) => value >= targetValue)
    .sort((a, b) => a.value - b.value);
  if (smallestSufficient) {
    return [smallestSufficient];
  }

  const selected: T[] = [];
  [...utxos]
    .sort((a, b) => b.value - a.value)
    .some((utxo) => {
      selected.push(utxo);
      return sumValues(selected) >= targetValue;
    });
  return selected;
}

/**
 * Virtual size of sending `amount` at `feeRate` with the UTXOs `selectUtxos` picks for it and
 * its fee. Change of at least `dustAmount` gets an output.
 * No UTXOs count as one input, so an empty wallet still gets a usual size.
 */
export function estimateSendVsize(
  utxos: { value: number }[],
  amount: number,
  feeRate: number,
  {
    dustAmount,
    getVsize,
  }: {
    dustAmount: number;
    getVsize: (inputCount: number, hasChange: boolean) => number;
  },
): number {
  const getSendVsize = (fee: number) => {
    const selected = selectUtxos(utxos, amount + fee);
    const hasChange = sumValues(selected) - amount - fee >= dustAmount;
    return getVsize(Math.max(selected.length, 1), hasChange);
  };
  // The fee can take more inputs or the change; stop once a size repeats.
  const vsizes: number[] = [];
  let vsize = getSendVsize(0);
  while (!vsizes.includes(vsize)) {
    vsizes.push(vsize);
    vsize = getSendVsize(Math.ceil(feeRate * vsize));
  }
  // A size that keeps flipping pays for the largest one it flips between.
  return Math.max(...vsizes.slice(vsizes.indexOf(vsize)));
}

/**
 * Virtual sizes of sending `amount` `sendsCount` times in a row at `feeRate`, see
 * `estimateSendVsize`. Each send spends what the one before left: its unspent UTXOs and
 * its change.
 * A `sweep` (Max) is sized by the UTXOs alone, as its amount follows the fee. A send can't spend
 * more than all of them, as each spends one at least and adds one change at most, and all but
 * the last leave change. The last leaves a unit per send at most, which is dust.
 * `getVsize` also gets the index of the send, as recipients can take outputs of other sizes.
 */
export function estimateSendsVsizes(
  utxos: { value: number }[],
  amount: number,
  sendsCount: number,
  feeRate: number,
  {
    dustAmount,
    sweep,
    getVsize,
  }: {
    dustAmount: number;
    sweep?: boolean;
    getVsize: (inputCount: number, hasChange: boolean, sendIndex: number) => number;
  },
): number[] {
  if (sweep) {
    return Array.from({ length: sendsCount }, (_, sendIndex) => getVsize(
      Math.max(utxos.length, 1),
      sendIndex < sendsCount - 1,
      sendIndex,
    ));
  }
  let unspent = utxos;
  return Array.from({ length: sendsCount }, (_, sendIndex) => {
    const vsize = estimateSendVsize(unspent, amount, feeRate, {
      dustAmount,
      getVsize: (inputCount, hasChange) => getVsize(inputCount, hasChange, sendIndex),
    });
    // Pick the UTXOs as signing does for this fee
    const fee = Math.ceil(feeRate * vsize);
    const selected = selectUtxos(unspent, amount + fee);
    const change = sumValues(selected) - amount - fee;
    unspent = [
      ...unspent.filter((utxo) => !selected.includes(utxo)),
      ...change >= dustAmount ? [{ value: change }] : [],
    ];
    return vsize;
  });
}

/**
 * Reads an esplora transaction from the owner's side (the first input's side if there is none).
 * The owner spending an input makes it outgoing, and outputs to input addresses count as change.
 */
export function normalizeTransactionStructure(
  transaction: any,
  transactionOwner?: string,
  protocol: ITransaction['protocol'] = PROTOCOLS.bitcoin,
): ITransaction {
  const {
    fee,
    status,
    txid,
    vin,
    vout,
  } = transaction;

  // Coinbase inputs have no prevout
  const inputs: { address?: string; value: number }[] = vin.map(({ prevout }: any) => ({
    address: prevout?.scriptpubkey_address,
    value: prevout?.value ?? 0,
  }));
  const inputAddresses = inputs.map(({ address }) => address);
  // OP_RETURN and other outputs without an address are paid away too
  const outputs: { address?: string; value: number }[] = vout
    .map(({ scriptpubkey_address: address, value }: any) => ({ address, value }));

  const owner = transactionOwner || inputAddresses[0];
  const ownerOutputs = outputs.filter(({ address }) => address && address === owner);
  const paidOutputs = outputs
    .filter(({ address }) => !address || !inputAddresses.includes(address));
  let isOutgoing = !!owner && inputAddresses.includes(owner);
  let transferOutputs = isOutgoing ? paidOutputs : ownerOutputs;
  if (isOutgoing && !transferOutputs.length) {
    // Paying itself, the wallet puts the amount first and the change after it
    transferOutputs = ownerOutputs.slice(0, 1);
  }
  let amountInSatoshi = sumValues(transferOutputs);

  // Others spend inputs too (PayJoin, CoinJoin, a seed also used in another wallet):
  // the owner sent or received what its balance changed by.
  if (isOutgoing && inputAddresses.some((address) => address !== owner)) {
    const balanceChange = sumValues(ownerOutputs)
      - sumValues(inputs.filter(({ address }) => address === owner));
    isOutgoing = balanceChange < 0;
    amountInSatoshi = isOutgoing ? Math.max(0, -balanceChange - fee) : balanceChange;
    // The payee, else a co-spender the owner paid
    transferOutputs = isOutgoing
      ? [...paidOutputs, ...outputs.filter(({ address }) => address !== owner)]
      : ownerOutputs;
  }

  return {
    protocol,
    transactionOwner: transactionOwner as any,
    hash: txid, // TODO: we can go with additional field
    blockHeight: status.block_height,
    microTime: status.block_time * 1000,
    pending: !status.confirmed,
    tx: {
      amount: satoshiToBtc(amountInSatoshi),
      fee: satoshiToBtc(fee),
      senderId: isOutgoing ? owner : inputAddresses.find((address) => address && address !== owner),
      recipientId: transferOutputs.find(({ address }) => address)?.address ?? owner,
      type: 'SpendTx', // TODO: create own types
      arguments: [],
      callerId: '' as any,
      contractId: ProtocolAdapterFactory.getAdapter(protocol).coinContractId,
    },
  };
}
