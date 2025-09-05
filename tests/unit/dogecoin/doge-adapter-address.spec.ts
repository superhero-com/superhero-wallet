import { expect } from '@jest/globals';
import { DogecoinAdapter } from '../../../src/protocols/dogecoin/libs/DogecoinAdapter';

describe('DogecoinAdapter - address basics', () => {
  const adapter = new DogecoinAdapter();

  it('derives a P2PKH address and validates it', () => {
    const seed = new Uint8Array(32).fill(1);
    const account = adapter.getHdWalletAccountFromMnemonicSeed(seed, 0);
    expect(typeof account.address).toBe('string');
    expect(['D', 'n'].some((p) => account.address.startsWith(p))).toBe(true);
    expect(adapter.isAccountAddressValid(account.address)).toBe(true);
    expect(adapter.isValidAddressOrNameEncoding(account.address)).toBe(true);
  });

  it('rejects an invalid address', () => {
    expect(adapter.isAccountAddressValid('not-a-doge-address')).toBe(false);
    expect(adapter.isValidAddressOrNameEncoding('not-a-doge-address')).toBe(false);
  });
});
