import { expect, jest } from '@jest/globals';

jest.mock('@/composables/networks', () => ({
  useNetworks: () => ({
    activeNetwork: { value: { protocols: { solana: { nodeUrl: 'http://localhost', explorerUrl: '' } } } },
  }),
}));

// Mock web3 connection and token list fetch
// Mock token list fetchJson so adapter can map token metadata
jest.mock('@/utils', () => ({
  // Keep other utils mocks minimal; token metadata will be injected directly into adapter cache
  fetchJson: async () => ({ tokens: [] }),
  getLastNotEmptyAccountIndex: jest.fn(),
}));

// Connection is created via adapter.getConnection; stub it to return parsed token accounts
function mockConnection() {
  return {
    getParsedTokenAccountsByOwner: async () => ({
      value: [
        { account: { data: { parsed: { info: { mint: 'MintA', tokenAmount: { uiAmount: 1, decimals: 6 } } } } } },
      ],
    }),
  } as any;
}

describe('SolanaAdapter - fetchAccountTokenBalances', () => {
  it('returns parsed balances joined with token metadata', async () => {
    // eslint-disable-next-line global-require
    const { SolanaAdapter } = require('@/protocols/solana/libs/SolanaAdapter');
    const adapter = new SolanaAdapter();
    jest.spyOn(adapter as any, 'getConnection').mockReturnValue(mockConnection());
    // Seed token metadata cache to avoid network and ensure name/symbol resolution
    (adapter as any).tokenListCache = [
      {
        contractId: 'MintA', name: 'Token A', symbol: 'TKA', decimals: 6, protocol: 'solana', price: 0, image: '',
      },
    ];
    const res = await adapter.fetchAccountTokenBalances('11111111111111111111111111111111' as any);
    expect(res?.length).toBe(1);
    expect(res?.[0].contractId).toBe('MintA');
    expect(res?.[0].name).toBe('Token A');
    expect(res?.[0].symbol).toBe('TKA');
    expect(Number(res?.[0].convertedBalance)).toBe(1);
  });
});
