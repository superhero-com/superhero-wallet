import { mnemonicToSeedSync } from '@scure/bip39';
import { Transaction, payments, networks as bitcoinNetworks } from 'bitcoinjs-lib';

import { BitcoinAdapter } from '@/protocols/bitcoin/libs/BitcoinAdapter';
import { estimateSendVsize, estimateSendsVsizes } from '@/protocols/bitcoin/helpers';
import { useNetworks } from '@/composables/networks';
import { NETWORK_NAME_MAINNET } from '@/constants';

const MNEMONIC = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

function buildFundingTxHex(address: string, valueSats: number) {
  const tx = new Transaction();
  tx.version = 2;
  tx.addInput(Buffer.alloc(32, 1), 0);
  (tx.ins[0] as any).witness = [Buffer.alloc(1)];
  const { output } = payments.p2wpkh({ address, network: bitcoinNetworks.bitcoin });
  tx.addOutput(output!, BigInt(valueSats));
  return tx.toHex();
}

/** Input txids in the order the transaction spends them. */
function inputTxids(tx: Transaction) {
  return tx.ins.map((input) => Buffer.from(input.hash).reverse().toString('hex'));
}

describe('BitcoinAdapter - UTXO selection and fee sizing', () => {
  const { switchNetwork, activeNetwork } = useNetworks();
  switchNetwork(NETWORK_NAME_MAINNET);

  const adapter = new BitcoinAdapter();
  /** Of a send to one recipient, at each of `feeRates` */
  const estimateVsize = async (
    amount: number,
    recipient: string,
    feeRates: number[],
    options: { address: string; sweep?: boolean },
  ) => (await adapter.estimateSendsVsizes(amount, [recipient], feeRates, options))
    .map(([vsize]) => vsize);
  const account = adapter.getHdWalletAccountFromMnemonicSeed(mnemonicToSeedSync(MNEMONIC), 0);
  const { nodeUrl } = activeNetwork.value.protocols.bitcoin;
  const recipient = payments.p2wpkh({
    pubkey: Buffer.from('0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798', 'hex'),
    network: bitcoinNetworks.bitcoin,
  }).address!;
  const keys = {
    address: account.address,
    publicKey: Buffer.from(account.publicKey),
    secretKey: Buffer.from(account.secretKey),
  };

  function mockUtxos(values: number[]) {
    const utxos = values.map((value, idx) => ({
      txid: (idx + 10).toString(16).padStart(2, '0').repeat(32),
      vout: 0,
      value,
    }));
    const hexByTxid = Object.fromEntries(
      utxos.map(({ txid, value }) => [txid, buildFundingTxHex(account.address, value)]),
    );
    // @ts-ignore - test double for the fetch boundary
    global.fetch = vi.fn((url: any) => {
      const u = String(url);
      if (u === `${nodeUrl}/address/${account.address}/utxo`) {
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(utxos) });
      }
      const match = u.match(/\/tx\/([0-9a-f]+)\/hex$/);
      if (match && hexByTxid[match[1]]) {
        return Promise.resolve({
          ok: true,
          status: 200,
          text: () => Promise.resolve(hexByTxid[match[1]]),
        });
      }
      return Promise.reject(new Error(`Unhandled fetch: ${u}`));
    });
    return utxos.map(({ txid }) => txid);
  }

  /** Never short of the signed size; a signature a byte shorter leaves at most 1 vB over. */
  function expectSizeOf(tx: Transaction, vsize: number) {
    expect(vsize - tx.virtualSize()).toBeGreaterThanOrEqual(0);
    expect(vsize - tx.virtualSize()).toBeLessThanOrEqual(1);
  }

  it('spends the smallest UTXO that covers amount + fee', async () => {
    const [, fittingTxid] = mockUtxos([50_000, 12_000, 9_500]);

    const tx = await adapter.constructAndSignTx(0.0001, recipient, { ...keys, fee: 0.00001 });

    expect(inputTxids(tx)).toEqual([fittingTxid]);
  });

  it('spends the largest UTXOs first when none covers the send alone', async () => {
    const [, midTxid, bigTxid] = mockUtxos([10_000, 15_000, 25_000]);

    const tx = await adapter.constructAndSignTx(0.0002, recipient, { ...keys, fee: 0.00006 });

    expect(inputTxids(tx)).toEqual([bigTxid, midTxid]);
  });

  it('adds the input the fee itself needs', async () => {
    mockUtxos([20_000, 20_000, 20_000]);
    const feeRate = 10;

    // 39,000 fits two inputs, but not with the fee for them.
    const [vsize] = await estimateVsize(0.00039, recipient, [feeRate], keys);
    const tx = await adapter.constructAndSignTx(
      0.00039,
      recipient,
      { ...keys, fee: (feeRate * vsize) / 1e8 },
    );

    expect(tx.ins).toHaveLength(3);
    expectSizeOf(tx, vsize);
  });

  it('sizes a send above the balance with every UTXO instead of throwing', async () => {
    mockUtxos([20_000, 20_000, 20_000]);

    const [vsize] = await estimateVsize(0.001, recipient, [10], keys);
    // Every UTXO, no change output
    const sendAll = await adapter.constructAndSignTx(0.00059, recipient, { ...keys, fee: 0.00001 });

    expect(sendAll.ins).toHaveLength(3);
    expectSizeOf(sendAll, vsize);
  });

  it('sizes a sweep with every UTXO and without fetching their transactions', async () => {
    mockUtxos([1_697, 2_509_618, 1_832_092]);
    const feeRate = 60;

    // The balance minus the fee for three inputs, which two inputs nearly cover
    const [vsize] = await estimateVsize(
      0.04328647,
      recipient,
      [feeRate],
      { ...keys, sweep: true },
    );
    expect(vi.mocked(global.fetch).mock.calls.filter(([url]) => String(url).endsWith('/hex')))
      .toEqual([]);
    const tx = await adapter.constructAndSignTx(
      0.04328647,
      recipient,
      { ...keys, fee: (feeRate * vsize) / 1e8 },
    );

    expect(tx.ins).toHaveLength(3);
    expect(tx.outs).toHaveLength(1);
    expectSizeOf(tx, vsize);
  });

  it('pays at least the rate when the fee decides whether change is dust', async () => {
    // 1,800 sat over the amount: change after a 110 vB fee, dust after a 141 vB one. The
    // unused UTXO adds a round, so the last size is the smaller one.
    mockUtxos([101_800, 1_000_000]);
    const feeRate = 10;

    const [vsize] = await estimateVsize(0.001, recipient, [feeRate], keys);
    const fee = feeRate * vsize;
    const tx = await adapter.constructAndSignTx(0.001, recipient, { ...keys, fee: fee / 1e8 });

    expect(fee / tx.virtualSize()).toBeGreaterThanOrEqual(feeRate);
  });

  it.each([
    // Two P2WPKH inputs, the payment and change
    [0.0004, 209],
    // Two inputs and the payment: the 220 sat left goes to the fee
    [0.00058, 178],
  ])('sizes sending %s BTC from two UTXOs at %i vB', async (amount, expectedVsize) => {
    mockUtxos([30_000, 30_000]);
    const feeRate = 10;

    const [vsize] = await estimateVsize(amount, recipient, [feeRate], keys);
    const tx = await adapter.constructAndSignTx(
      amount,
      recipient,
      { ...keys, fee: (feeRate * vsize) / 1e8 },
    );

    expect(vsize).toBe(expectedVsize);
    expect(tx.ins).toHaveLength(2);
    expectSizeOf(tx, vsize);
  });

  it('adds every input the fee needs, however many that takes', async () => {
    // At 100 sat/vB each UTXO pays for little more than itself.
    mockUtxos([10_500, 10_500, 10_500, 10_500, 10_500]);
    const feeRate = 100;

    const [vsize] = await estimateVsize(0.0001, recipient, [feeRate], keys);
    const fee = feeRate * vsize;
    const tx = await adapter.constructAndSignTx(0.0001, recipient, { ...keys, fee: fee / 1e8 });

    expect(tx.ins).toHaveLength(5);
    expect(fee / tx.virtualSize()).toBeGreaterThanOrEqual(feeRate);
  });

  it('sizes the output of a P2WSH recipient', async () => {
    mockUtxos([100_000]);
    const p2wsh = payments.p2wsh({
      hash: Buffer.alloc(32, 5),
      network: bitcoinNetworks.bitcoin,
    }).address!;
    const feeRate = 10;

    const [vsize] = await estimateVsize(0.0005, p2wsh, [feeRate], keys);
    const tx = await adapter.constructAndSignTx(
      0.0005,
      p2wsh,
      { ...keys, fee: (feeRate * vsize) / 1e8 },
    );

    // One P2WPKH input, the 43-byte P2WSH payment and change
    expect(vsize).toBe(153);
    expect(tx.outs).toHaveLength(2);
    expectSizeOf(tx, vsize);
  });

  it('sizes the output of each send by the address of its own recipient', async () => {
    mockUtxos([100_000]);
    const p2wsh = payments.p2wsh({
      hash: Buffer.alloc(32, 5),
      network: bitcoinNetworks.bitcoin,
    }).address!;

    // One input and change each, the P2WSH payment 12 vB larger
    expect(await adapter.estimateSendsVsizes(0.0003, [recipient, p2wsh], [10], keys))
      .toEqual([[141, 153]]);
    expect(await adapter.estimateSendsVsizes(0.0003, [p2wsh, recipient], [10], keys))
      .toEqual([[153, 141]]);
  });

  it('sizes the other sends while a recipient is not an address', async () => {
    mockUtxos([100_000]);

    // As the change, P2WPKH
    expect(await adapter.estimateSendsVsizes(0.0003, [recipient, 'bc1qnotanaddress'], [10], keys))
      .toEqual([[141, 141]]);
  });

  it('sizes each fee rate with one request for the UTXOs', async () => {
    mockUtxos([100_000, 50_000]);

    // The fastest fee no longer fits the first UTXO and takes both, with change.
    expect(await estimateVsize(0.000997, recipient, [1, 2, 3], keys))
      .toEqual([110, 110, 209]);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('sizes each of several sends for what the one before leaves, as signing spends it', async () => {
    mockUtxos([110_000, ...Array(10).fill(10_000)]);

    const [[firstVsize, secondVsize]] = await adapter.estimateSendsVsizes(
      0.001,
      [recipient, recipient],
      [10],
      keys,
    );
    // One input and change
    expect(firstVsize).toBe(141);
    // Every 10,000 sat UTXO and the change of the first send. Its fee flips the change
    // between dust and not, so it pays for the size with change.
    expect(secondVsize).toBe(821);

    const first = await adapter.constructAndSignTx(0.001, recipient, { ...keys, fee: 0.0000141 });
    expectSizeOf(first, firstVsize);
    expect(first.outs.map(({ value }) => Number(value))).toEqual([100_000, 8_590]);

    // The node lists the change of the first send with the UTXOs it left
    mockUtxos([...Array(10).fill(10_000), 8_590]);
    const second = await adapter.constructAndSignTx(0.001, recipient, { ...keys, fee: 0.0000821 });
    expect(second.ins).toHaveLength(11);
    // The 380 sat of change is dust and goes to the fee
    expect(second.outs).toHaveLength(1);
    expectSizeOf(second, 790);
  });

  it('sizes each send of a Max to several recipients as spending every UTXO, all but the last with change', async () => {
    mockUtxos([100_000, 50_000]);

    // Two P2WPKH inputs and the payment, with change before the last
    expect(await adapter.estimateSendsVsizes(0.0007, [recipient, recipient], [10], {
      ...keys,
      sweep: true,
    })).toEqual([[209, 178]]);
  });

  it('pays the picked rate with each send of a Max to several recipients, signed in turn', async () => {
    mockUtxos([100_000]);
    const feeRate = 10;

    const [vsizes] = await adapter.estimateSendsVsizes(0.0009, [recipient, recipient], [feeRate], {
      ...keys,
      sweep: true,
    });
    const fees = vsizes.map((vsize) => Math.ceil(feeRate * vsize));
    // As the form's Max: what the fees leave, split between the recipients
    const amount = Math.floor((100_000 - fees[0] - fees[1]) / 2) / 1e8;

    const first = await adapter.constructAndSignTx(
      amount,
      recipient,
      { ...keys, fee: fees[0] / 1e8 },
    );
    // The first leaves the second half as change
    expect(first.outs).toHaveLength(2);
    expect(fees[0]).toBeGreaterThanOrEqual(feeRate * first.virtualSize());

    mockUtxos([Number(first.outs[1].value)]);
    const second = await adapter.constructAndSignTx(
      amount,
      recipient,
      { ...keys, fee: fees[1] / 1e8 },
    );
    expect(second.outs).toHaveLength(1);
    expect(fees[1]).toBeGreaterThanOrEqual(feeRate * second.virtualSize());
  });

  it('pays the picked rate with each send of a Max to several recipients from several UTXOs', async () => {
    mockUtxos([60_000, 50_000]);
    const feeRate = 10;

    const [vsizes] = await adapter.estimateSendsVsizes(0.001, [recipient, recipient], [feeRate], {
      ...keys,
      sweep: true,
    });
    const fees = vsizes.map((vsize) => Math.ceil(feeRate * vsize));
    const amount = Math.floor((110_000 - fees[0] - fees[1]) / 2) / 1e8;

    const first = await adapter.constructAndSignTx(
      amount,
      recipient,
      { ...keys, fee: fees[0] / 1e8 },
    );
    // The 60,000 sat UTXO covers it, with change above dust
    expect(first.ins).toHaveLength(1);
    expect(first.outs).toHaveLength(2);
    expect(fees[0]).toBeGreaterThanOrEqual(feeRate * first.virtualSize());

    mockUtxos([50_000, Number(first.outs[1].value)]);
    const second = await adapter.constructAndSignTx(
      amount,
      recipient,
      { ...keys, fee: fees[1] / 1e8 },
    );
    expect(second.ins).toHaveLength(2);
    expect(second.outs).toHaveLength(1);
    expect(fees[1]).toBeGreaterThanOrEqual(feeRate * second.virtualSize());
  });

  it('pays a fee given in a fraction of a satoshi in the nearest whole satoshis', async () => {
    mockUtxos([100_000]);

    // 1,935.67 sat, a third of a fee for three sends
    const tx = await adapter.constructAndSignTx(0.0005, recipient, {
      ...keys,
      fee: 5807 / 3 / 1e8,
    });

    expect(Number(tx.outs[1].value)).toBe(100_000 - 50_000 - 1936);
  });

  it('fetches the transactions of the selected UTXOs only', async () => {
    const txids = mockUtxos([20_000, 100_000, 50_000]);

    await adapter.constructAndSignTx(0.0004, recipient, { ...keys, fee: 0.00001 });

    expect(vi.mocked(global.fetch).mock.calls
      .map(([url]) => String(url))
      .filter((url) => url.endsWith('/hex')))
      .toEqual([`${nodeUrl}/tx/${txids[2]}/hex`]);
  });

  it('refuses to sign when the transaction of a UTXO fails to load', async () => {
    mockUtxos([100_000]);
    const fetchUtxos = global.fetch;
    // @ts-ignore - test double for the fetch boundary
    global.fetch = vi.fn((url: any) => (String(url).endsWith('/hex')
      ? Promise.resolve({ ok: false, status: 429, text: () => Promise.resolve('Too many requests') })
      : fetchUtxos(url)));

    await expect(adapter.constructAndSignTx(0.0001, recipient, { ...keys, fee: 0.00001 }))
      .rejects.toThrow('HTTP 429');
  });

  it('refuses UTXOs without a value', async () => {
    const [txid] = mockUtxos([20_000]);
    const fetchFunding = global.fetch;
    // @ts-ignore - test double for the fetch boundary
    global.fetch = vi.fn((url: any) => (String(url).endsWith('/utxo')
      ? Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([{ txid, vout: 0 }]) })
      : fetchFunding(url)));

    await expect(adapter.constructAndSignTx(0.0001, recipient, { ...keys, fee: 0.00001 }))
      .rejects.toThrow('Insufficient balance');
  });

  it('refuses a UTXO response that is not a list', async () => {
    // @ts-ignore - test double for the fetch boundary
    global.fetch = vi.fn(() => Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ error: 'Too many requests' }),
    }));

    await expect(estimateVsize(0.0001, recipient, [10], keys))
      .rejects.toThrow('Unexpected UTXO response');
    await expect(adapter.constructAndSignTx(0.0001, recipient, { ...keys, fee: 0.00001 }))
      .rejects.toThrow('Unexpected UTXO response');
  });

  it('sizes an empty wallet as one input', async () => {
    mockUtxos([]);

    // One P2WPKH input and output
    expect(await estimateVsize(0.0001, recipient, [10], keys)).toEqual([110]);
  });

  it('stops sizing once a size repeats, however many UTXOs the send leaves unused', () => {
    // Change after a 110 vB fee, dust after a 141 vB one, so the size flips between them.
    const utxos = [101_800, ...Array(30).fill(1_000_000)].map((value) => ({ value }));
    const getVsize = vi.fn((inputCount: number, hasChange: boolean) => (
      Math.ceil((42 + 272 * inputCount + 124 + (hasChange ? 124 : 0)) / 4)
    ));

    expect(estimateSendVsize(utxos, 100_000, 10, { dustAmount: 546, getVsize })).toBe(141);
    expect(getVsize).toHaveBeenCalledTimes(3);
  });

  it('sizes a later send with the change of the one before, but no dust change', () => {
    const getVsize = (inputCount: number, hasChange: boolean) => (
      Math.ceil((42 + 272 * inputCount + 124 + (hasChange ? 124 : 0)) / 4)
    );
    // At 20 sat/vB the first send takes 100,000 sat whole, leaving 300 sat of dust to the fee
    const utxos = [97_800, 100_000, 500_000].map((value) => ({ value }));

    expect(estimateSendsVsizes(utxos, 97_500, 3, 20, { dustAmount: 546, getVsize }))
      // The second takes 500,000 sat with change, which the third takes
      .toEqual([110, 141, 141]);
  });
});
