import { BitcoinAdapter } from '@/protocols/bitcoin/libs/BitcoinAdapter';

describe('BitcoinAdapter - waitTransactionMined polling', () => {
  const adapter = new BitcoinAdapter();

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('resolves once the transaction is picked up by the node', async () => {
    const txObj = { hash: 'abc' } as any;
    const spy = vi.spyOn(adapter, 'fetchTransactionByHash');
    spy
      .mockResolvedValueOnce(null as any)
      .mockResolvedValueOnce(null as any)
      .mockResolvedValueOnce(txObj);

    const promise = adapter.waitTransactionMined('abc');
    vi.advanceTimersByTime(5000 * 3);
    const res = await promise;
    expect(res).toBe(txObj);
  });

  it('resolves null after the max number of polling attempts (never hangs forever)', async () => {
    const spy = vi.spyOn(adapter, 'fetchTransactionByHash').mockResolvedValue(null as any);
    const promise = adapter.waitTransactionMined('abc');
    vi.advanceTimersByTime(5000 * 10);
    const res = await promise;
    expect(res).toBeNull();
    expect(spy).toHaveBeenCalled();
  });

  it('resolves null when every lookup rejects (Blockstream 404 "Transaction not found")', async () => {
    vi.restoreAllMocks();
    // Blockstream answers an unknown transaction with a text/plain 404
    const fetchSpy = vi.fn(async () => new Response('Transaction not found', { status: 404 }));
    // @ts-ignore - test double for the fetch boundary
    global.fetch = fetchSpy;
    const unhandled = vi.fn();
    process.on('unhandledRejection', unhandled);

    let result: any = 'pending';
    adapter.waitTransactionMined('00'.repeat(32)).then((res) => { result = res; });
    await vi.advanceTimersByTimeAsync(5000 * 10);
    expect(result).toBeNull();

    await vi.advanceTimersByTimeAsync(5000 * 5);
    expect(fetchSpy).toHaveBeenCalledTimes(10);
    process.off('unhandledRejection', unhandled);
    expect(unhandled).not.toHaveBeenCalled();
  });
});
