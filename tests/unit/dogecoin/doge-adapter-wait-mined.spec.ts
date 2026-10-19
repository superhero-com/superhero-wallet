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

  it('resolves null when every lookup rejects', async () => {
    vi.restoreAllMocks();
    const fetchSpy = vi.fn(() => Promise.resolve({
      status: 404,
      json: () => Promise.reject(new SyntaxError('Unexpected token T in JSON')),
    }));
    // @ts-ignore - test double for the fetch boundary
    global.fetch = fetchSpy;
    const unhandled = vi.fn();
    process.on('unhandledRejection', unhandled);

    let result: any = 'pending';
    adapter.waitTransactionMined('abc').then((res) => { result = res; });
    await vi.advanceTimersByTimeAsync(5000 * 10);
    expect(result).toBeNull();

    await vi.advanceTimersByTimeAsync(5000 * 5);
    expect(fetchSpy).toHaveBeenCalledTimes(10);
    process.off('unhandledRejection', unhandled);
    expect(unhandled).not.toHaveBeenCalled();
  });
});
