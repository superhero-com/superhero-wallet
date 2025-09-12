/* global describe, it, jest */
import { expect } from '@jest/globals';
import { SolanaAdapter } from '@/protocols/solana/libs/SolanaAdapter';
import { PROTOCOLS } from '@/constants';

// Default mocks at module level to avoid redefining properties via spyOn
jest.mock('@/composables', () => ({
  useAccounts: () => ({
    getAccountByProtocolAndAddress: (addr: string) => ({
      address: addr,
      protocol: PROTOCOLS.solana,
      secretKey: new Array(64).fill(1),
    }),
  }),
}));

jest.mock('@/composables/networks', () => ({
  useNetworks: () => ({
    activeNetwork: { value: { protocols: { solana: { nodeUrl: 'http://localhost', explorerUrl: '' } } } },
  }),
}));

describe('SolanaAdapter - spend flow', () => {
  it('constructs and sends a transaction, returning a signature', async () => {
    const adapter = new SolanaAdapter();
    // Avoid hitting real web3: stub instance methods
    jest.spyOn(adapter as any, 'constructAndSignTx').mockResolvedValue({
      serialize: () => new Uint8Array([1, 2, 3]),
    } as any);
    jest.spyOn(adapter as any, 'getConnection').mockReturnValue({
      sendRawTransaction: () => Promise.resolve('signature'),
    } as any);

    const res = await adapter.spend(1, 'RecipientAddress', { fromAccount: 'SenderAddress' } as any);
    expect(res).toEqual({ hash: 'signature' });
  });

  it('throws for invalid from account protocol', async () => {
    const adapter = new SolanaAdapter();
    // Temporarily override getAccountByProtocolAndAddress behavior
    // eslint-disable-next-line global-require
    const original = require('@/composables').useAccounts;
    // eslint-disable-next-line global-require
    (require('@/composables') as any).useAccounts = () => ({
      getAccountByProtocolAndAddress: () => ({ protocol: 'not-solana' }),
    });
    await expect(adapter.constructAndSignTx(1, 'R', { fromAccount: 'S' } as any)).rejects.toThrow();
    // eslint-disable-next-line global-require
    (require('@/composables') as any).useAccounts = original;
  });
});
