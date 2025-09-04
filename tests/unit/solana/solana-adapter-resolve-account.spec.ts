/* global describe, it, jest */
import { expect } from '@jest/globals';
// eslint-disable-next-line import/no-relative-packages
import { SolanaAdapter } from '../../../src/protocols/solana/libs/SolanaAdapter';

// Minimal mocks for Keypair used by resolveAccountRaw
// Spy on Keypair methods to avoid real base58 derivations; normalize to known strings
// eslint-disable-next-line global-require
// eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
const web3 = require('@solana/web3.js') as any;

(jest.spyOn(web3.Keypair as any, 'fromSecretKey') as any).mockImplementation(() => ({
  secretKey: new Uint8Array(64).fill(2),
  publicKey: {
    toBytes: () => new Uint8Array(32).fill(7),
    toBase58: () => 'Pub58_Secret',
  },
}));
(jest.spyOn(web3.Keypair as any, 'fromSeed') as any).mockImplementation(() => ({
  secretKey: new Uint8Array(64).fill(2),
  publicKey: {
    toBytes: () => new Uint8Array(32).fill(3),
    toBase58: () => 'Pub58_Seed',
  },
}));

describe('SolanaAdapter - resolveAccountRaw private-key parsing', () => {
  const adapter = new SolanaAdapter();

  const baseRaw = { type: 'private-key' } as any;

  it('accepts 64-byte secret key Uint8Array', () => {
    const raw = { ...baseRaw, privateKey: new Uint8Array(64).fill(1) };
    const res = adapter.resolveAccountRaw(raw, 0, 0);
    expect(res?.address).toBe('Pub58_Secret');
    expect(res?.secretKey?.length).toBe(64);
  });

  it('accepts 32-byte seed Uint8Array', () => {
    const raw = { ...baseRaw, privateKey: new Uint8Array(32).fill(1) };
    const res = adapter.resolveAccountRaw(raw, 1, 1);
    expect(res?.address).toBe('Pub58_Seed');
  });

  it('accepts Buffer-like object', () => {
    const data = Array.from({ length: 64 }, (_, i) => (i % 256));
    const raw = { ...baseRaw, privateKey: { type: 'Buffer', data } };
    const res = adapter.resolveAccountRaw(raw, 2, 2);
    expect(res?.address).toBe('Pub58_Secret');
  });

  it('accepts JSON array string', () => {
    const arr = JSON.stringify(Array.from({ length: 64 }, () => 1));
    const res = adapter.resolveAccountRaw({ ...baseRaw, privateKey: arr }, 3, 3);
    expect(res?.address).toBe('Pub58_Secret');
  });

  it('accepts hex string', () => {
    const hex = Buffer.from(new Uint8Array(32).fill(9)).toString('hex');
    const res = adapter.resolveAccountRaw({ ...baseRaw, privateKey: hex }, 4, 4);
    expect(res?.address).toBe('Pub58_Seed');
  });

  it('accepts base64 string', () => {
    const b64 = Buffer.from(new Uint8Array(64).fill(5)).toString('base64');
    const res = adapter.resolveAccountRaw({ ...baseRaw, privateKey: b64 }, 5, 5);
    expect(res?.address).toBe('Pub58_Secret');
  });

  it('returns null for invalid format', () => {
    const res = adapter.resolveAccountRaw({ ...baseRaw, privateKey: 12345 }, 6, 6);
    expect(res).toBeNull();
  });
});
