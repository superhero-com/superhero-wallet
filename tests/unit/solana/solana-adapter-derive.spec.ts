import { SolanaAdapter } from '@/protocols/solana/libs/SolanaAdapter';
import { expect } from '@jest/globals';

describe('SolanaAdapter - HD derivation', () => {
  const adapter = new SolanaAdapter();

  it('derives deterministic account from mnemonic seed', () => {
    // 32 bytes zeroed seed for determinism (not a real BIP39 seed)
    const seed = new Uint8Array(32).fill(1);
    const acc0 = adapter.getHdWalletAccountFromMnemonicSeed(seed, 0);
    const acc1 = adapter.getHdWalletAccountFromMnemonicSeed(seed, 1);

    expect(acc0.address).toBeDefined();
    expect(acc0.publicKey).toBeInstanceOf(Uint8Array);
    expect(acc0.secretKey).toBeInstanceOf(Uint8Array);

    // Different index yields different address
    expect(acc0.address).not.toBe(acc1.address);
  });
});
