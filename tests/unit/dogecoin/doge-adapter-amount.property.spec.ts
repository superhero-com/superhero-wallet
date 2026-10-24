import fc from 'fast-check';
import * as ecc from '@bitcoinerlab/secp256k1';
import ECPairFactory from 'ecpair';
import { Transaction, payments } from 'bitcoinjs-lib';

import { DogecoinAdapter } from '@/protocols/dogecoin/libs/DogecoinAdapter';
import { useNetworks } from '@/composables/networks';
import { NETWORK_NAME_MAINNET } from '@/constants';
import { DOGE_DUST_AMOUNT } from '@/protocols/dogecoin/config';
import { amountWithBaseUnits } from '../../fixtures/amountArbitraries';

const { DOGE_MAINNET } = DogecoinAdapter as any;
const ECPair = ECPairFactory(ecc);

// Below 2^26 DOGE every amount with 8 decimals is its own double (the form hands numbers over).
const dogeAmount = amountWithBaseUnits(8, 2n ** 26n - 1n).map(({ amount, baseUnits }) => ({
  doge: Number(amount),
  koinu: Number(baseUnits),
}));

describe('DogecoinAdapter - amounts (property)', () => {
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

  it('signs the exact koinu of the amount and the fee', async () => {
    await fc.assert(fc.asyncProperty(dogeAmount, dogeAmount, async (amount, fee) => {
      const changeKoinu = DOGE_DUST_AMOUNT + 100_000;
      const inputValue = BigInt(amount.koinu) + BigInt(fee.koinu) + BigInt(changeKoinu);
      fc.pre(inputValue <= BigInt(Number.MAX_SAFE_INTEGER));
      const input = Number(inputValue);
      const funding = new Transaction();
      funding.version = 1;
      funding.addInput(Buffer.alloc(32, 1), 0);
      funding.addOutput(
        payments.p2pkh({ address: sender, network: DOGE_MAINNET }).output!,
        BigInt(input),
      );
      const txid = funding.getId();
      // @ts-ignore - test double for the fetch boundary
      global.fetch = vi.fn((url: any) => {
        const u = String(url);
        if (u === `${nodeUrl}/address/${sender}/utxo`) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve([{ txid, vout: 0, value: input }]),
          });
        }
        if (u === `${nodeUrl}/tx/${txid}/hex`) {
          return Promise.resolve({
            ok: true,
            status: 200,
            text: () => Promise.resolve(funding.toHex()),
          });
        }
        return Promise.reject(new Error(`Unhandled fetch: ${u}`));
      });

      const tx = await adapter.constructAndSignTx(amount.doge, recipient, {
        address: sender,
        fee: fee.doge,
        publicKey: Buffer.from(senderKeys.publicKey),
        secretKey: Buffer.from(senderKeys.privateKey!),
      });
      const outputs = Transaction.fromHex(tx.toHex()).outs;
      const [output, change] = outputs;

      expect(outputs).toHaveLength(2);
      expect(output.value).toBe(BigInt(amount.koinu));
      expect(change.value).toBe(BigInt(changeKoinu));
      expect(inputValue - outputs.reduce((sum, item) => sum + item.value, 0n))
        .toBe(BigInt(fee.koinu));
    }), { numRuns: 200 });
  });
});
