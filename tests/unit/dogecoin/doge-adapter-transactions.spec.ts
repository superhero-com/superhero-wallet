import { expect, jest } from '@jest/globals';
import { DogecoinAdapter } from '../../../src/protocols/dogecoin/libs/DogecoinAdapter';
import { NETWORK_TYPE_TESTNET, PROTOCOLS } from '../../../src/constants';

jest.mock('../../../src/composables/networks', () => ({
  useNetworks: () => ({
    activeNetwork: {
      value: {
        type: NETWORK_TYPE_TESTNET,
        protocols: {
          [PROTOCOLS.dogecoin]: { nodeUrl: 'http://localhost:3000' },
        },
      },
    },
  }),
}));

describe('DogecoinAdapter - transactions listing and pagination', () => {
  const adapter = new DogecoinAdapter();

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('normalizes account transactions and returns pagination params', async () => {
    const list = [{
      fee: 1000,
      status: { block_height: 10, block_time: 1700000000, confirmed: true },
      txid: 'tx1',
      vin: [{ prevout: { scriptpubkey: 'a', scriptpubkey_address: 'Sender' } }],
      vout: [
        { value: 1_000_000_000, scriptpubkey: 'x', scriptpubkey_address: 'Recipient' },
      ],
    }];
    // @ts-ignore
    global.fetch = jest.fn(() => Promise.resolve({ json: () => Promise.resolve(list) })) as any;

    const res = await adapter.fetchAccountTransactions('Addr');
    expect(res.regularTransactions.length).toBe(1);
    expect(res.paginationParams?.lastTxId).toBe('tx1');
    expect(res.regularTransactions[0].protocol).toBe('dogecoin');
  });

  it('fetches single tx by hash and normalizes', async () => {
    const tx = {
      fee: 1200,
      status: { block_height: 11, block_time: 1700000100, confirmed: false },
      txid: 'abc',
      vin: [{ prevout: { scriptpubkey: 'a', scriptpubkey_address: 'S' } }],
      vout: [
        { value: 2_000_000_000, scriptpubkey: 'x', scriptpubkey_address: 'R' },
      ],
    };
    // @ts-ignore
    global.fetch = jest.fn(() => Promise.resolve({ json: () => Promise.resolve(tx) })) as any;

    const res = await adapter.fetchTransactionByHash('abc', 'S');
    expect(res.hash).toBe('abc');
    expect(res.pending).toBe(true);
    expect(res.tx.contractId).toBe('dogecoin');
  });
});
