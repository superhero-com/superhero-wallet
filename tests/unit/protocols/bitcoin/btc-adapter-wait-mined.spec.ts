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
});
