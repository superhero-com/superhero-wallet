import * as ecc from '@bitcoinerlab/secp256k1';
import ECPairFactory from 'ecpair';
import { Transaction, payments, address as bitcoinAddress } from 'bitcoinjs-lib';

import { DogecoinAdapter } from '@/protocols/dogecoin/libs/DogecoinAdapter';
import { useNetworks } from '@/composables/networks';
import { NETWORK_NAME_MAINNET } from '@/constants';

const { DOGE_MAINNET } = DogecoinAdapter as any;
const ECPair = ECPairFactory(ecc);

describe('DogecoinAdapter - change output', () => {
  const { switchNetwork, activeNetwork } = useNetworks();
  switchNetwork(NETWORK_NAME_MAINNET);

  const adapter = new DogecoinAdapter();
  const { nodeUrl } = activeNetwork.value.protocols.dogecoin;
  const senderKeys = ECPair.fromPrivateKey(Buffer.alloc(32, 7));
  const sender = payments.p2pkh({
    pubkey: Buffer.from(senderKeys.publicKey),
    network: DOGE_MAINNET,
  }).address!;
  const recipient = payments.p2pkh({
    pubkey: Buffer.from(ECPair.fromPrivateKey(Buffer.alloc(32, 9)).publicKey),
    network: DOGE_MAINNET,
  }).address!;

  const AMOUNT = 100_000_000; // 1 DOGE
  const FEE = 225_000; // 0.00225 DOGE

  async function send(change: number) {
    const input = AMOUNT + FEE + change;
    const funding = new Transaction();
    funding.version = 1;
    funding.addInput(Buffer.alloc(32, 1), 0);
    const { output: senderScript } = payments.p2pkh({ address: sender, network: DOGE_MAINNET });
    funding.addOutput(senderScript!, BigInt(input));
    const txid = funding.getId();
    // @ts-ignore - test double for the fetch boundary
    global.fetch = vi.fn((url: any) => {
      const u = String(url);
      if (u === `${nodeUrl}/address/${sender}/utxo`) {
        return Promise.resolve({
          status: 200,
          json: () => Promise.resolve([{ txid, vout: 0, value: input }]),
        });
      }
      if (u === `${nodeUrl}/tx/${txid}/hex`) {
        return Promise.resolve({ text: () => Promise.resolve(funding.toHex()) });
      }
      return Promise.reject(new Error(`Unhandled fetch: ${u}`));
    });

    const tx = await adapter.constructAndSignTx(AMOUNT / 1e8, recipient, {
      address: sender,
      fee: FEE / 1e8,
      publicKey: Buffer.from(senderKeys.publicKey),
      secretKey: Buffer.from(senderKeys.privateKey!),
    });
    const outputs = Transaction.fromHex(tx.toHex()).outs.map((output) => [
      bitcoinAddress.fromOutputScript(output.script, DOGE_MAINNET),
      Number(output.value),
    ]);
    const impliedFee = input - outputs.reduce((sum, [, value]) => sum + Number(value), 0);
    return { outputs, impliedFee };
  }

  it.each([1, 999_999])('adds %i koinu of change to the fee instead of a dust output', async (change) => {
    const { outputs, impliedFee } = await send(change);

    expect(outputs).toEqual([[recipient, AMOUNT]]);
    expect(impliedFee).toBe(FEE + change);
  });

  it('returns 0.01 DOGE of change to the sender', async () => {
    const { outputs, impliedFee } = await send(1_000_000);

    expect(outputs).toEqual([[recipient, AMOUNT], [sender, 1_000_000]]);
    expect(impliedFee).toBe(FEE);
  });

  it('sizes a send without the change it adds to the fee', async () => {
    // 0.01 DOGE over the amount before the fee, less after it
    // @ts-ignore - test double for the fetch boundary
    global.fetch = vi.fn(() => Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve([{ txid: 'ab'.repeat(32), vout: 0, value: AMOUNT + 1_000_000 }]),
    }));

    // One P2PKH input and the payment
    expect(await adapter.estimateVsize(AMOUNT / 1e8, recipient, [1000], { address: sender }))
      .toEqual([10 + 148 + 34]);
  });
});
