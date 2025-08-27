import { expect, jest } from '@jest/globals';
import { DogecoinAdapter } from '../../../src/protocols/dogecoin/libs/DogecoinAdapter';

describe('DogecoinAdapter - waitTransactionMined polling', () => {
  const adapter = new DogecoinAdapter();

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('resolves when tx appears', async () => {
    const txObj = { hash: 'abc' } as any;
    const spy = jest.spyOn(adapter, 'fetchTransactionByHash');
    spy
      .mockResolvedValueOnce(null as any)
      .mockResolvedValueOnce(null as any)
      .mockResolvedValueOnce(txObj);

    const promise = adapter.waitTransactionMined('abc');
    // advance three intervals
    jest.advanceTimersByTime(5000 * 3);
    const res = await promise;
    expect(res).toBe(txObj);
  });

  it('resolves null after max attempts', async () => {
    const spy = jest.spyOn(adapter, 'fetchTransactionByHash').mockResolvedValue(null as any);
    const promise = adapter.waitTransactionMined('abc');
    // 10 attempts
    jest.advanceTimersByTime(5000 * 10);
    const res = await promise;
    expect(res).toBeNull();
    expect(spy).toHaveBeenCalled();
  });
});
