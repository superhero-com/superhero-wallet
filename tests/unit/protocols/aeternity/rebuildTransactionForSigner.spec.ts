import { Tag, buildTx, unpackTx } from '@aeternity/aepp-sdk';
import type { Encoded } from '@aeternity/aepp-sdk';

import {
  canRebuildTransactionForSigner,
  rebuildTransactionForSigner,
} from '@/protocols/aeternity/helpers';

/**
 * The sender is part of the transaction, so only the account it was built for
 * can produce a signature the node accepts. When the user chooses to sign with
 * another account, the transaction has to be re-pointed at it.
 */

const ADDRESS_A = 'ak_2dATVcZ9KJU5a8hdsVtTv21pYiGWiPbmVcU1Pz72FFqpk9pSRR' as Encoded.AccountAddress;
const ADDRESS_B = 'ak_21A27UVVt3hDkBE5J7rhhqnH5YNb4Y1dqo4PnSybrH85pnWo7E' as Encoded.AccountAddress;
const CONTRACT_ID = 'ct_2dATVcZ9KJU5a8hdsVtTv21pYiGWiPbmVcU1Pz72FFqpk9pSRR';

const NEXT_NONCE = 7;
const fetchNextNonce = vi.fn(async () => NEXT_NONCE);

const buildSpendTx = (senderId = ADDRESS_A, recipientId = ADDRESS_B) => buildTx({
  tag: Tag.SpendTx,
  senderId,
  recipientId,
  amount: 1e18,
  fee: 20000000000000,
  nonce: 1,
  payload: 'ba_Xfbg4g==',
}) as Encoded.Transaction;

const buildContractCallTx = () => buildTx({
  tag: Tag.ContractCallTx,
  callerId: ADDRESS_A,
  contractId: CONTRACT_ID,
  abiVersion: 3,
  amount: 0,
  gasLimit: 100,
  gasPrice: 1000000000,
  callData: 'cb_Xfbg4g==',
  fee: 1000000000000000,
  nonce: 1,
}) as Encoded.Transaction;

describe('rebuildTransactionForSigner', () => {
  beforeEach(() => {
    fetchNextNonce.mockClear();
  });

  it('re-points a SpendTx at the chosen account and gives it a fresh nonce', async () => {
    const rebuilt = await rebuildTransactionForSigner(buildSpendTx(), ADDRESS_B, fetchNextNonce);
    const params = unpackTx(rebuilt) as any;

    expect(params.senderId).toBe(ADDRESS_B);
    expect(params.nonce).toBe(NEXT_NONCE);
    expect(fetchNextNonce).toHaveBeenCalledWith(ADDRESS_B);
  });

  it('leaves the rest of the transaction untouched', async () => {
    const original = unpackTx(buildSpendTx()) as any;
    const rebuilt = unpackTx(
      await rebuildTransactionForSigner(buildSpendTx(), ADDRESS_B, fetchNextNonce),
    ) as any;

    expect(rebuilt.recipientId).toBe(original.recipientId);
    expect(String(rebuilt.amount)).toBe(String(original.amount));
    expect(String(rebuilt.fee)).toBe(String(original.fee));
  });

  it('re-points the caller of a ContractCallTx, not some other address field', async () => {
    const rebuilt = unpackTx(
      await rebuildTransactionForSigner(buildContractCallTx(), ADDRESS_B, fetchNextNonce),
    ) as any;

    expect(rebuilt.callerId).toBe(ADDRESS_B);
    // The contract being called must not be rewritten along with the caller.
    expect(rebuilt.contractId).toBe(CONTRACT_ID);
  });

  it('rewrites the sender, not the recipient, when sending to yourself', async () => {
    // Both fields hold the same address here, so picking the wrong one would
    // silently leave the transaction signed by the original account.
    const selfSend = buildSpendTx(ADDRESS_A, ADDRESS_A);

    const rebuilt = unpackTx(
      await rebuildTransactionForSigner(selfSend, ADDRESS_B, fetchNextNonce),
    ) as any;

    expect(rebuilt.senderId).toBe(ADDRESS_B);
    expect(rebuilt.recipientId).toBe(ADDRESS_A);
  });

  it('rebuilds to a transaction the chosen account can actually sign', async () => {
    // The whole point: the node derives the signer from the transaction itself.
    const { getTransactionSignerAddress } = await import('@aeternity/aepp-sdk');
    const rebuilt = await rebuildTransactionForSigner(buildSpendTx(), ADDRESS_B, fetchNextNonce);

    expect(getTransactionSignerAddress(rebuilt)).toBe(ADDRESS_B);
  });
});

describe('canRebuildTransactionForSigner', () => {
  it('accepts transactions whose sender is a plain account', () => {
    expect(canRebuildTransactionForSigner(buildSpendTx())).toBe(true);
    expect(canRebuildTransactionForSigner(buildContractCallTx())).toBe(true);
  });

  it('rejects an already signed transaction', () => {
    const signed = buildTx({
      tag: Tag.SignedTx,
      encodedTx: unpackTx(buildSpendTx()) as any,
      signatures: [new Uint8Array(64)],
    }) as Encoded.Transaction;

    expect(canRebuildTransactionForSigner(signed)).toBe(false);
  });

  it('rejects garbage instead of throwing', () => {
    expect(canRebuildTransactionForSigner('tx_notARealTransaction' as Encoded.Transaction))
      .toBe(false);
  });
});
