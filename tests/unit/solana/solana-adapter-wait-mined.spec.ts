import { SolanaAdapter } from '@/protocols/solana/libs/SolanaAdapter';

vi.useFakeTimers();

describe('SolanaAdapter - waitTransactionMined', () => {
  it('resolves when confirmation status becomes confirmed', async () => {
    const adapter = new SolanaAdapter();
    const getSignatureStatus = (vi.fn() as any)
      .mockResolvedValueOnce({ value: { confirmationStatus: 'processed' } } as any)
      .mockResolvedValueOnce({ value: { confirmationStatus: 'confirmed' } } as any);
    vi.spyOn(adapter as any, 'getConnection').mockReturnValue({ getSignatureStatus } as any);

    const prom = adapter.waitTransactionMined('sig');
    // fast-forward intervals
    await Promise.resolve();
    vi.runOnlyPendingTimers();
    await Promise.resolve();
    vi.runOnlyPendingTimers();
    const res = await prom;
    expect(res).toEqual({ confirmationStatus: 'confirmed' });
  });
});
