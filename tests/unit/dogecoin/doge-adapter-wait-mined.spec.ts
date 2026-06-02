import { DogecoinAdapter } from '../../../src/protocols/dogecoin/libs/DogecoinAdapter';

describe('DogecoinAdapter - waitTransactionMined polling', () => {
  const adapter = new DogecoinAdapter();

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('resolves when tx appears', async () => {
    const txObj = { hash: 'abc' } as any;
    const spy = vi.spyOn(adapter, 'fetchTransactionByHash');
    spy
      .mockResolvedValueOnce(null as any)
      .mockResolvedValueOnce(null as any)
      .mockResolvedValueOnce(txObj);

    const promise = adapter.waitTransactionMined('abc');
    // advance three intervals
    vi.advanceTimersByTime(5000 * 3);
    const res = await promise;
    expect(res).toBe(txObj);
  });

  it('resolves null after max attempts', async () => {
    const spy = vi.spyOn(adapter, 'fetchTransactionByHash').mockResolvedValue(null as any);
    const promise = adapter.waitTransactionMined('abc');
    // 10 attempts
    vi.advanceTimersByTime(5000 * 10);
    const res = await promise;
    expect(res).toBeNull();
    expect(spy).toHaveBeenCalled();
  });
});
