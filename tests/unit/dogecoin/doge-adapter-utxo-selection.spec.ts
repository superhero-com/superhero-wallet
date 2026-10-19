import * as ecc from '@bitcoinerlab/secp256k1';
import ECPairFactory from 'ecpair';
import { Transaction, payments } from 'bitcoinjs-lib';

import { DogecoinAdapter } from '@/protocols/dogecoin/libs/DogecoinAdapter';
import { useNetworks } from '@/composables/networks';
import { NETWORK_NAME_MAINNET } from '@/constants';

const { DOGE_MAINNET } = DogecoinAdapter as any;
const ECPair = ECPairFactory(ecc);

/** Input txids in the order the transaction spends them. */
function inputTxids(tx: Transaction) {
  return tx.ins.map((input) => Buffer.from(input.hash).reverse().toString('hex'));
}

describe('DogecoinAdapter - UTXO selection and fee sizing', () => {
  const { switchNetwork, activeNetwork } = useNetworks();
  switchNetwork(NETWORK_NAME_MAINNET);

  const adapter = new DogecoinAdapter();
  const { nodeUrl } = activeNetwork.value.protocols.dogecoin;
  const senderKeys = ECPair.fromPrivateKey(Buffer.alloc(32, 7));
  const keys = {
    address: payments.p2pkh({
      pubkey: Buffer.from(senderKeys.publicKey),
      network: DOGE_MAINNET,
    }).address!,
    publicKey: Buffer.from(senderKeys.publicKey),
    secretKey: Buffer.from(senderKeys.privateKey!),
  };
  const recipient = payments.p2pkh({
    pubkey: Buffer.from(ECPair.fromPrivateKey(Buffer.alloc(32, 9)).publicKey),
    network: DOGE_MAINNET,
  }).address!;

  /** Funds the sender with a UTXO of each value and returns their txids. */
  function mockUtxos(values: number[]) {
    const { output } = payments.p2pkh({ address: keys.address, network: DOGE_MAINNET });
    const fundings = values.map((value, idx) => {
      const funding = new Transaction();
      funding.version = 1;
      funding.addInput(Buffer.alloc(32, idx + 1), 0);
      funding.addOutput(output!, BigInt(value));
      return funding;
    });
    const utxos = fundings.map((funding, idx) => ({
      txid: funding.getId(),
      vout: 0,
      value: values[idx],
    }));
    // @ts-ignore - test double for the fetch boundary
    global.fetch = vi.fn((url: any) => {
      const u = String(url);
      if (u === `${nodeUrl}/address/${keys.address}/utxo`) {
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(utxos) });
      }
      const funding = fundings.find((tx) => u === `${nodeUrl}/tx/${tx.getId()}/hex`);
      if (funding) {
        return Promise.resolve({ ok: true, text: () => Promise.resolve(funding.toHex()) });
      }
      return Promise.reject(new Error(`Unhandled fetch: ${u}`));
    });
    return utxos.map(({ txid }) => txid);
  }

  it('spends the one UTXO that covers amount + fee instead of a closer smaller one', async () => {
    // 0.9999 DOGE is closest to 1 DOGE but leaves nothing for the fee.
    const [, bigTxid] = mockUtxos([99_990_000, 120_000_000]);

    const tx = await adapter.constructAndSignTx(1, recipient, { ...keys, fee: 0.00226 });

    expect(inputTxids(tx)).toEqual([bigTxid]);
  });

  it('spends the two largest UTXOs when none covers the send alone, with a fee for both', async () => {
    const [, midTxid, bigTxid] = mockUtxos([10_000_000, 50_000_000, 60_000_000]);
    const feeRate = 1000;

    const [vsize] = await adapter.estimateVsize(1, recipient, [feeRate], keys);
    const tx = await adapter.constructAndSignTx(
      1,
      recipient,
      { ...keys, fee: (feeRate * vsize) / 1e8 },
    );

    expect(inputTxids(tx)).toEqual([bigTxid, midTxid]);
    // Never short; a signature a byte shorter than the longest leaves a byte over.
    expect(vsize - tx.virtualSize()).toBeGreaterThanOrEqual(0);
    expect(vsize - tx.virtualSize()).toBeLessThanOrEqual(tx.ins.length);
  });

  it('uses exact koinu when float multiplication would cross the UTXO boundary', async () => {
    const amount = 40_000_000.12345678;
    const exactAmount = 4_000_000_012_345_678;
    expect(Math.round(amount * 1e8)).toBe(exactAmount + 1);

    // Exact conversion leaves the first UTXO sufficient; the legacy float conversion needs two.
    mockUtxos([exactAmount + 192_000, 500_000]);

    expect(await adapter.estimateVsize(amount, recipient, [1000], keys)).toEqual([192]);
  });

  it('sizes a sweep with every UTXO and no change', async () => {
    mockUtxos([10_000_000, 50_000_000, 60_000_000]);

    // Max after a fee sized with change: three P2PKH inputs and the payment
    expect(await adapter.estimateVsize(1.19478, recipient, [1000], { ...keys, sweep: true }))
      .toEqual([10 + 3 * 148 + 34]);
  });

  it('refuses to size from a UTXO response that is not a list', async () => {
    // @ts-ignore - test double for the fetch boundary
    global.fetch = vi.fn(() => Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ error: 'Too many requests' }),
    }));

    await expect(adapter.estimateVsize(1, recipient, [1000], keys))
      .rejects.toThrow('Unexpected UTXO response');
  });

  it('refuses a fee that is not a number instead of paying everything as fee', async () => {
    mockUtxos([10_000_000, 50_000_000, 60_000_000]);

    await expect(adapter.constructAndSignTx(1, recipient, { ...keys, fee: NaN }))
      .rejects.toThrow('Insufficient balance');
  });
});
