import { mnemonicToSeedSync } from '@scure/bip39';
import {
  Transaction,
  payments,
  networks as bitcoinNetworks,
  address as bitcoinAddress,
} from 'bitcoinjs-lib';

import { BitcoinAdapter } from '@/protocols/bitcoin/libs/BitcoinAdapter';
import { useNetworks } from '@/composables/networks';
import { NETWORK_NAME_MAINNET } from '@/constants';
import { DUST_AMOUNT } from '@/protocols/bitcoin/config';

/**
 * Same published BIP-84 test mnemonic used across this directory (see
 * btc-adapter-address.spec.ts) -- account 0, mainnet, m/84'/0'/0'/0/0 =
 * bc1qcr8te4kr609gcawutmrza0j4xv80jy8z306fyu.
 */
const BIP84_TEST_MNEMONIC = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
const BIP84_MAINNET_ACCOUNT0_ADDRESS = 'bc1qcr8te4kr609gcawutmrza0j4xv80jy8z306fyu';

/**
 * Builds a *synthetic* funding ("previous") transaction that pays `valueSats`
 * to `recipientAddress` as a native-segwit (p2wpkh) output, with a witness
 * marker on its (dummy) input so `BitcoinAdapter.constructAndSignTx`'s
 * `parsedTransaction.hasWitnesses()` check takes the witnessUtxo path -- this
 * is what the Blockstream `/tx/:txid/hex` endpoint would return for a real
 * previous transaction. It does not need a valid signature itself: only the
 * *new* transaction the adapter builds and signs from it is under test.
 */
function buildFundingTxHex(
  recipientAddress: string,
  valueSats: number,
  network = bitcoinNetworks.bitcoin,
) {
  const tx = new Transaction();
  tx.version = 2;
  tx.addInput(Buffer.alloc(32, 1), 0);
  (tx.ins[0] as any).witness = [Buffer.alloc(1)];
  const { output } = payments.p2wpkh({ address: recipientAddress, network });
  tx.addOutput(output!, BigInt(valueSats));
  return tx.toHex();
}

function mockUtxoFetch(
  nodeUrl: string,
  address: string,
  utxos: { txid: string; vout: number; value: number }[],
  fundingHexByTxid: Record<string, string>,
) {
  // @ts-ignore - test double for the fetch boundary
  global.fetch = vi.fn((url: any) => {
    const u = String(url);
    if (u === `${nodeUrl}/address/${address}/utxo`) {
      return Promise.resolve({ status: 200, json: () => Promise.resolve(utxos) });
    }
    const m = u.match(/\/tx\/([0-9a-f]+)\/hex$/);
    if (m && fundingHexByTxid[m[1]]) {
      return Promise.resolve({ text: () => Promise.resolve(fundingHexByTxid[m[1]]) });
    }
    if (u === `${nodeUrl}/tx`) {
      return Promise.resolve({ status: 200, text: () => Promise.resolve('broadcast-txid') });
    }
    return Promise.reject(new Error(`Unhandled fetch: ${u}`));
  }) as any;
}

describe('BitcoinAdapter - constructAndSignTx (UTXO selection, dust, change, overspend)', () => {
  const { switchNetwork, activeNetwork } = useNetworks();
  switchNetwork(NETWORK_NAME_MAINNET);

  const adapter = new BitcoinAdapter();
  const seed = mnemonicToSeedSync(BIP84_TEST_MNEMONIC);
  const account = adapter.getHdWalletAccountFromMnemonicSeed(seed, 0);
  const senderAddress = account.address;
  const { nodeUrl } = activeNetwork.value.protocols.bitcoin;

  // An arbitrary, syntactically-valid mainnet bech32 recipient distinct from
  // the sender. Built directly from bitcoinjs-lib (a trusted external
  // library), not from the adapter under test, and not asserted as an
  // "expected value" anywhere -- just scaffolding.
  const recipientAddress = payments.p2wpkh({
    pubkey: Buffer.from('0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798', 'hex'),
    network: bitcoinNetworks.bitcoin,
  }).address!;

  const AMOUNT_BTC = 0.0001; // 10_000 sats
  const FEE_BTC = 0.00001; // 1_000 sats
  const AMOUNT_SATS = 10_000;
  const FEE_SATS = 1_000;

  async function construct(totalInputSats: number) {
    const txid = 'ab'.repeat(32);
    const fundingHex = buildFundingTxHex(senderAddress, totalInputSats);
    mockUtxoFetch(
      nodeUrl,
      senderAddress,
      [{ txid, vout: 0, value: totalInputSats }],
      { [txid]: fundingHex },
    );

    return adapter.constructAndSignTx(AMOUNT_BTC, recipientAddress, {
      address: senderAddress,
      fee: FEE_BTC,
      publicKey: Buffer.from(account.publicKey),
      secretKey: Buffer.from(account.secretKey),
    });
  }

  function outputAddress(tx: Transaction, index: number) {
    return bitcoinAddress.fromOutputScript(tx.outs[index].script, bitcoinNetworks.bitcoin);
  }

  function totalOut(tx: Transaction) {
    return tx.outs.reduce((sum, o) => sum + Number(o.value), 0);
  }

  beforeEach(() => {
    vi.resetAllMocks();
  });

  // Sanity: sender key material really is the published BIP-84 vector, so
  // downstream assertions are exercising the real, externally-verifiable key.
  it('sender address used in this suite matches the published BIP-84 test vector', () => {
    expect(senderAddress).toBe(BIP84_MAINNET_ACCOUNT0_ADDRESS);
  });

  it('change strictly below the dust threshold is swept into the fee, not created as a dust output', async () => {
    const change = DUST_AMOUNT - 1; // 545
    const tx = await construct(AMOUNT_SATS + FEE_SATS + change);

    expect(tx.outs.length).toBe(1);
    expect(Number(tx.outs[0].value)).toBe(AMOUNT_SATS);
    expect(outputAddress(tx, 0)).toBe(recipientAddress);

    // No money materializes from nowhere: outputs + implied fee == inputs.
    const impliedFee = (AMOUNT_SATS + FEE_SATS + change) - totalOut(tx);
    expect(impliedFee).toBeGreaterThanOrEqual(0);
    expect(impliedFee).toBe(FEE_SATS + change); // dust got folded into the fee
  });

  // Wallet-safety expectation: change AT OR ABOVE the dust threshold should
  // go back to the sender as a change output, not be silently swept into the
  // fee. The implementation's condition is `>= DUST_AMOUNT`, so a change
  // value of exactly DUST_AMOUNT is returned to the sender.
  it('change exactly equal to the dust threshold is returned to the sender as a change output', async () => {
    const change = DUST_AMOUNT; // 546
    const tx = await construct(AMOUNT_SATS + FEE_SATS + change);

    expect(tx.outs.length).toBe(2);
    expect(Number(tx.outs[1].value)).toBe(change);
    expect(outputAddress(tx, 1)).toBe(senderAddress);
  });

  it('change comfortably above the dust threshold creates a change output back to the sender', async () => {
    const change = 1_000;
    const tx = await construct(AMOUNT_SATS + FEE_SATS + change);

    expect(tx.outs.length).toBe(2);
    expect(Number(tx.outs[0].value)).toBe(AMOUNT_SATS);
    expect(outputAddress(tx, 0)).toBe(recipientAddress);
    expect(Number(tx.outs[1].value)).toBe(change);
    expect(outputAddress(tx, 1)).toBe(senderAddress);

    const impliedFee = (AMOUNT_SATS + FEE_SATS + change) - totalOut(tx);
    expect(impliedFee).toBe(FEE_SATS);
    expect(impliedFee).toBeGreaterThanOrEqual(0);
  });

  it('input value exactly equal to amount + fee produces no change output and no error', async () => {
    const totalInput = AMOUNT_SATS + FEE_SATS;
    const tx = await construct(totalInput);

    expect(tx.outs.length).toBe(1);
    const impliedFee = totalInput - totalOut(tx);
    expect(impliedFee).toBe(FEE_SATS);
    expect(impliedFee).toBeGreaterThanOrEqual(0);
  });

  it('rejects (throws) when available UTXO value is less than amount + fee -- fee/amount can never exceed inputs', async () => {
    const totalInput = AMOUNT_SATS + FEE_SATS - 1; // one sat short
    await expect(construct(totalInput)).rejects.toThrow('Insufficient balance');
  });

  it('rejects when the fee alone already exceeds the available UTXO value', async () => {
    const txid = 'cd'.repeat(32);
    const tinyUtxo = 500; // less than FEE_SATS
    const fundingHex = buildFundingTxHex(senderAddress, tinyUtxo);
    mockUtxoFetch(
      nodeUrl,
      senderAddress,
      [{ txid, vout: 0, value: tinyUtxo }],
      { [txid]: fundingHex },
    );

    await expect(adapter.constructAndSignTx(0.000001, recipientAddress, {
      address: senderAddress,
      fee: FEE_BTC,
      publicKey: Buffer.from(account.publicKey),
      secretKey: Buffer.from(account.secretKey),
    })).rejects.toThrow('Insufficient balance');
  });
});

describe('BitcoinAdapter - spend() broadcast flow', () => {
  const { switchNetwork, activeNetwork } = useNetworks();
  switchNetwork(NETWORK_NAME_MAINNET);
  const adapter = new BitcoinAdapter();
  const { nodeUrl } = activeNetwork.value.protocols.bitcoin;

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('broadcasts the signed raw transaction hex and returns the resulting txid', async () => {
    const txHex = '01020304';
    vi.spyOn(adapter, 'constructAndSignTx').mockResolvedValue({ toHex: () => txHex } as any);

    // @ts-ignore
    global.fetch = vi.fn((url: string) => {
      if (String(url) === `${nodeUrl}/tx`) {
        return Promise.resolve({ status: 200, text: () => Promise.resolve('txid123') });
      }
      return Promise.reject(new Error('unexpected url'));
    }) as any;

    const res = await adapter.spend(0.0001, 'Recipient', {
      address: 'Sender', fee: 0.00001, publicKey: Buffer.alloc(33), secretKey: Buffer.alloc(32),
    });
    expect(res).toEqual({ hash: 'txid123' });
  });

  it('throws with the node error body when broadcast fails (non-200)', async () => {
    vi.spyOn(adapter, 'constructAndSignTx').mockResolvedValue({ toHex: () => 'deadbeef' } as any);
    // @ts-ignore
    global.fetch = vi.fn(() => Promise.resolve({ status: 500, text: () => Promise.resolve('rejected by node') })) as any;

    await expect(adapter.spend(0.0001, 'Recipient', {
      address: 'Sender', fee: 0.00001, publicKey: Buffer.alloc(33), secretKey: Buffer.alloc(32),
    })).rejects.toThrow('rejected by node');
  });
});
