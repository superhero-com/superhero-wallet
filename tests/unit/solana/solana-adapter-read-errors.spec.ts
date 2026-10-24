// @ts-nocheck
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { SolanaAdapter } from '@/protocols/solana/libs/SolanaAdapter';

const ADDRESS = '11111111111111111111111111111111';

describe('SolanaAdapter read errors', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetchBalance resolves the balance in SOL', async () => {
    const adapter = new SolanaAdapter();
    vi.spyOn(adapter, 'getConnection').mockReturnValue({
      getBalance: async () => 2.5 * LAMPORTS_PER_SOL,
    });

    await expect(adapter.fetchBalance(ADDRESS)).resolves.toBe('2.5');
  });

  it('fetchBalance rejects when the RPC fails', async () => {
    const error = new Error('429 Too Many Requests');
    const adapter = new SolanaAdapter();
    vi.spyOn(adapter, 'getConnection').mockReturnValue({
      getBalance: async () => { throw error; },
    });

    await expect(adapter.fetchBalance(ADDRESS)).rejects.toBe(error);
  });

  it('fetchAccountTokenBalances returns null when the RPC fails', async () => {
    const adapter = new SolanaAdapter();
    vi.spyOn(adapter, 'getConnection').mockReturnValue({
      getParsedTokenAccountsByOwner: async () => { throw new Error('429 Too Many Requests'); },
    });

    expect(await adapter.fetchAccountTokenBalances(ADDRESS)).toBeNull();
  });
});
