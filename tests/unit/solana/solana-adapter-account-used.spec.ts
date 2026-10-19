import { Connection } from '@solana/web3.js';
import { SolanaAdapter } from '@/protocols/solana/libs/SolanaAdapter';

const ADDRESS = '11111111111111111111111111111111';

/** Stubs what the node answers about the address. */
function stubNode({ balance = 0, signatures = [] as any[], error = null as Error | null }) {
  const answer = (value: any) => (error ? Promise.reject(error) : Promise.resolve(value));
  vi.spyOn(Connection.prototype, 'getBalance').mockImplementation(() => answer(balance));
  vi.spyOn(Connection.prototype, 'getSignaturesForAddress')
    .mockImplementation(() => answer(signatures));
}

describe('SolanaAdapter - isAccountUsed', () => {
  const adapter = new SolanaAdapter();

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('is true for an address with a balance or a transaction', async () => {
    stubNode({ balance: 1 });
    await expect(adapter.isAccountUsed(ADDRESS)).resolves.toBe(true);

    stubNode({ signatures: [{}] });
    await expect(adapter.isAccountUsed(ADDRESS)).resolves.toBe(true);
  });

  it('is false for an unused address', async () => {
    stubNode({});
    await expect(adapter.isAccountUsed(ADDRESS)).resolves.toBe(false);
  });

  it('fails when the node does not answer, rather than calling the address unused', async () => {
    stubNode({ error: new Error('429 Too Many Requests') });
    await expect(adapter.isAccountUsed(ADDRESS)).rejects.toThrow('429');
  });
});
