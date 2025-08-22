import { SolanaAdapter } from '@/protocols/solana/libs/SolanaAdapter';
import { expect, jest } from '@jest/globals';

describe('SolanaAdapter - filter account asset transactions', () => {
  it('filters txs by contractId correctly', async () => {
    const adapter = new SolanaAdapter();
    const solId = adapter.coinContractId;

    // Mock fetchAccountTransactions to return mixed entries
    const mixed = [
      { tx: { contractId: solId } },
      { tx: { contractId: 'TokenMintA' } },
      { tx: { contractId: solId } },
      { tx: { contractId: 'TokenMintB' } },
    ] as any;

    jest.spyOn(adapter, 'fetchAccountTransactions').mockResolvedValue({
      regularTransactions: mixed as any,
      paginationParams: { nextPageUrl: 'abc' },
    } as any);

    const all = await adapter.fetchAccountAssetTransactions('Addr', solId);
    expect(all.regularTransactions.every((t) => t.tx.contractId === solId)).toBe(true);

    const tokenOnly = await adapter.fetchAccountAssetTransactions('Addr', 'TokenMintB' as any);
    expect(tokenOnly.regularTransactions.length).toBe(1);
    expect(tokenOnly.regularTransactions[0].tx.contractId).toBe('TokenMintB');
  });
});
