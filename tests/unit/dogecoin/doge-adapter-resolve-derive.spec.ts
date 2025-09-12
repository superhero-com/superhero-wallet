import { expect, jest } from '@jest/globals';
import { DogecoinAdapter } from '../../../src/protocols/dogecoin/libs/DogecoinAdapter';
import { ACCOUNT_TYPES, NETWORK_TYPE_TESTNET, PROTOCOLS } from '../../../src/constants';

jest.mock('../../../src/composables/networks', () => ({
  useNetworks: () => ({
    activeNetwork: {
      value: {
        type: NETWORK_TYPE_TESTNET,
        protocols: {
          [PROTOCOLS.dogecoin]: { nodeUrl: 'http://localhost:3000' },
        },
      },
    },
  }),
}));

describe('DogecoinAdapter - resolveAccountRaw and derivation', () => {
  const adapter = new DogecoinAdapter();

  it('derives deterministic HD account from seed', () => {
    const seed = new Uint8Array(32).fill(7);
    const acc0 = adapter.getHdWalletAccountFromMnemonicSeed(seed, 0);
    const acc1 = adapter.getHdWalletAccountFromMnemonicSeed(seed, 1);
    expect(acc0.address).toBeDefined();
    expect(acc0.publicKey).toBeInstanceOf(Buffer);
    expect(acc0.secretKey).toBeInstanceOf(Buffer);
    expect(acc0.address).not.toBe(acc1.address);
  });

  it('resolves private-key account to p2pkh address', () => {
    const priv = Buffer.from(new Uint8Array(32).fill(9));
    const raw = { type: ACCOUNT_TYPES.privateKey, privateKey: priv } as any;
    const res = adapter.resolveAccountRaw(raw, 0, 0);
    expect(res?.address).toBeDefined();
    expect(res?.publicKey?.length).toBeGreaterThan(0);
    expect(res?.secretKey?.length).toBe(32);
    expect(res?.privateKey).toBeUndefined();
  });

  it('returns null for unsupported raw account type', () => {
    const res = adapter.resolveAccountRaw({ type: 'unknown' } as any, 0, 0);
    expect(res).toBeNull();
  });
});
