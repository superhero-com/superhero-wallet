import { SolanaAdapter } from '@/protocols/solana/libs/SolanaAdapter';
import { expect, jest } from '@jest/globals';

jest.useFakeTimers();

describe('SolanaAdapter - waitTransactionMined', () => {
  it('resolves when confirmation status becomes confirmed', async () => {
    const adapter = new SolanaAdapter();
    const getSignatureStatus = (jest.fn() as any)
      .mockResolvedValueOnce({ value: { confirmationStatus: 'processed' } } as any)
      .mockResolvedValueOnce({ value: { confirmationStatus: 'confirmed' } } as any);
    jest.spyOn(adapter as any, 'getConnection').mockReturnValue({ getSignatureStatus } as any);

    const prom = adapter.waitTransactionMined('sig');
    // fast-forward intervals
    await Promise.resolve();
    jest.runOnlyPendingTimers();
    await Promise.resolve();
    jest.runOnlyPendingTimers();
    const res = await prom;
    expect(res).toEqual({ confirmationStatus: 'confirmed' });
  });
});
