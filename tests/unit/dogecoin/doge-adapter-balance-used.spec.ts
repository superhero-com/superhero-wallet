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

describe('DogecoinAdapter - balance and usage checks', () => {
  const adapter = new DogecoinAdapter();

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('fetches balance from node and converts to DOGE', async () => {
    const json = async () => ({
      chain_stats: { funded_txo_sum: 3_000_000_000, spent_txo_sum: 1_000_000_000 },
      mempool_stats: { funded_txo_sum: 200_000_000, spent_txo_sum: 100_000_000 },
    });
    // @ts-ignore - mock global
    global.fetch = jest.fn(() => Promise.resolve({ json })) as any;
    // fetchJson uses global.fetch under the hood in this codebase

    const bal = await adapter.fetchBalance('DAddress');
    expect(bal).toBe('21'); // (3000-1000 + 200-100) million sats = 2100_000_000 => 21 DOGE
  });

  it('checks isAccountUsed by tx_count', async () => {
    const json = async () => ({ chain_stats: { tx_count: 2 } });
    // @ts-ignore - mock global
    global.fetch = jest.fn(() => Promise.resolve({ json })) as any;

    const used = await adapter.isAccountUsed('DAddress');
    expect(used).toBe(true);
  });

  it('isAccountUsed returns false on error', async () => {
    // @ts-ignore - mock global
    global.fetch = jest.fn(() => Promise.reject(new Error('network error')));
    const used = await adapter.isAccountUsed('DAddress');
    expect(used).toBe(false);
  });
});
