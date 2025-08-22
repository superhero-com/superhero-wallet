import { SolanaAdapter } from '@/protocols/solana/libs/SolanaAdapter';
import { expect } from '@jest/globals';

jest.mock('@/composables/networks', () => ({
  useNetworks: () => ({
    activeNetwork: {
      value: {
        protocols: {
          solana: {
            nodeUrl: 'https://api.testnet.solana.com',
            // Some environments may not include query, default code must handle both
            explorerUrl: 'https://explorer.solana.com',
          },
        },
      },
    },
  }),
}));

describe('SolanaAdapter - explorer helpers', () => {
  const adapter = new SolanaAdapter();

  it('builds account and tx urls', () => {
    const explorer = adapter.getExplorer();
    expect(explorer.prepareUrlForAccount('Abc')).toBe('https://explorer.solana.com/address/Abc');
    expect(explorer.prepareUrlForHash('Sig')).toBe('https://explorer.solana.com/tx/Sig');
  });
});
