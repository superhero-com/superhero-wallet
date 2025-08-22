import { SolanaAdapter } from '@/protocols/solana/libs/SolanaAdapter';
import { expect } from '@jest/globals';

describe('SolanaAdapter - address validation basics', () => {
  const adapter = new SolanaAdapter();

  it('validates a correct Solana address', () => {
    // Known valid base58 address used across Solana docs (all zeros pubkey)
    const valid = '11111111111111111111111111111111';
    expect(adapter.isAccountAddressValid(valid)).toBe(true);
    expect(adapter.isValidAddressOrNameEncoding(valid)).toBe(true);
  });

  it('rejects an invalid address', () => {
    expect(adapter.isAccountAddressValid('not-a-base58-address')).toBe(false);
    expect(adapter.isValidAddressOrNameEncoding('not-a-base58-address')).toBe(false);
  });

  it('returns empty account prefix', () => {
    expect(adapter.getAccountPrefix()).toBe('');
  });
});
