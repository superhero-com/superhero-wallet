import { BitcoinAdapter } from '@/protocols/bitcoin/libs/BitcoinAdapter';
import { PROTOCOLS } from '@/constants';

/**
 * No network mock here: `vi.mock('.../composables/networks', ...)` is
 * unreliable for adapter-internal calls in this repo -- `registerAdapters.ts`
 * (a global setupFile) eagerly imports BitcoinAdapter, resolving its
 * `useNetworks` import to the REAL module before this file's mock is hoisted
 * into effect (see repo memory: "Vitest composable mocks must precede
 * registerAdapters import"). These tests only assert on URL *paths* (via
 * `toContain`) and on parsed response shape, so the REAL (default mainnet)
 * network composable is used and only `global.fetch` is mocked.
 */
describe('BitcoinAdapter - transaction listing and pagination', () => {
  const adapter = new BitcoinAdapter();

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('normalizes account transactions and derives pagination lastTxId from the last item', () => {
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
    global.fetch = vi.fn(() => Promise.resolve({ json: () => Promise.resolve(list) })) as any;

    return adapter.fetchAccountTransactions('Addr').then((res) => {
      expect(res.regularTransactions.length).toBe(1);
      expect(res.paginationParams?.lastTxId).toBe('tx1');
      expect(res.regularTransactions[0].protocol).toBe(PROTOCOLS.bitcoin);
      expect(res.regularTransactions[0].tx.contractId).toBe('bitcoin');
    });
  });

  it('paginates via lastTxId by hitting the /txs/chain/:lastTxId endpoint', async () => {
    // @ts-ignore
    global.fetch = vi.fn((url: string) => {
      expect(String(url)).toContain('/txs/chain/tx0');
      return Promise.resolve({ json: () => Promise.resolve([]) });
    }) as any;

    const res = await adapter.fetchAccountTransactions('Addr', { lastTxId: 'tx0' });
    expect(res.regularTransactions).toEqual([]);
    expect(res.paginationParams?.lastTxId).toBeUndefined();
  });

  it('fetches a single transaction by hash and normalizes it', async () => {
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
    global.fetch = vi.fn(() => Promise.resolve({ json: () => Promise.resolve(tx) })) as any;

    const res = await adapter.fetchTransactionByHash('abc', 'S');
    expect(res.hash).toBe('abc');
    expect(res.pending).toBe(true);
    expect(res.tx.contractId).toBe('bitcoin');
  });

  it('fetchAccountAssetTransactions is an alias for fetchAccountTransactions (BTC has only one asset)', async () => {
    const spy = vi.spyOn(adapter, 'fetchAccountTransactions').mockResolvedValue({
      regularTransactions: [],
      paginationParams: {},
    });

    await adapter.fetchAccountAssetTransactions('Addr', 'bitcoin', { lastTxId: 'x' });
    expect(spy).toHaveBeenCalledWith('Addr', { lastTxId: 'x' });
  });
});
