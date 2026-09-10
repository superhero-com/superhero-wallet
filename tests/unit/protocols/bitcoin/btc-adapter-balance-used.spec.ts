import { BitcoinAdapter } from '@/protocols/bitcoin/libs/BitcoinAdapter';

/**
 * No network mock here: `vi.mock('.../composables/networks', ...)` is
 * unreliable for adapter-internal calls in this repo -- `registerAdapters.ts`
 * (a global setupFile) eagerly imports BitcoinAdapter, resolving its
 * `useNetworks` import to the REAL module before this file's mock is hoisted
 * into effect (see repo memory: "Vitest composable mocks must precede
 * registerAdapters import"). These tests don't assert on the resolved
 * `nodeUrl` itself, only on the parsed response, so the REAL (default
 * mainnet) network composable is used and only `global.fetch` is mocked.
 */
describe('BitcoinAdapter - balance and usage checks', () => {
  const adapter = new BitcoinAdapter();

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('fetches balance from node and converts sats to BTC (chain + mempool, funded - spent)', async () => {
    const json = async () => ({
      chain_stats: { funded_txo_sum: 300_000_000, spent_txo_sum: 100_000_000 },
      mempool_stats: { funded_txo_sum: 20_000_000, spent_txo_sum: 10_000_000 },
    });
    // @ts-ignore - mock global
    global.fetch = vi.fn(() => Promise.resolve({ json })) as any;

    const bal = await adapter.fetchBalance('bc1qAddress');
    // (300-100 + 20-10) million sats = 210_000_000 sats => 2.1 BTC
    expect(bal).toBe('2.1');
  });

  it('balance is zero (not negative) when funded equals spent', async () => {
    const json = async () => ({
      chain_stats: { funded_txo_sum: 100_000_000, spent_txo_sum: 100_000_000 },
      mempool_stats: { funded_txo_sum: 0, spent_txo_sum: 0 },
    });
    // @ts-ignore
    global.fetch = vi.fn(() => Promise.resolve({ json })) as any;

    const bal = await adapter.fetchBalance('bc1qAddress');
    expect(bal).toBe('0');
  });

  it('isAccountUsed is true when the address has funded outputs on chain', async () => {
    const json = async () => ({ chain_stats: { funded_txo_sum: 5000 } });
    // @ts-ignore
    global.fetch = vi.fn(() => Promise.resolve({ json })) as any;

    const used = await adapter.isAccountUsed('bc1qAddress');
    expect(used).toBe(true);
  });

  it('isAccountUsed is false for a never-funded address', async () => {
    const json = async () => ({ chain_stats: { funded_txo_sum: 0 } });
    // @ts-ignore
    global.fetch = vi.fn(() => Promise.resolve({ json })) as any;

    const used = await adapter.isAccountUsed('bc1qAddress');
    expect(used).toBe(false);
  });
});
