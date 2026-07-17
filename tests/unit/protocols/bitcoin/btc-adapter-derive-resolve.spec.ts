import { mnemonicToSeedSync } from '@scure/bip39';

import { BitcoinAdapter } from '@/protocols/bitcoin/libs/BitcoinAdapter';
import { useNetworks } from '@/composables/networks';
import { ACCOUNT_TYPES, NETWORK_NAME_MAINNET } from '@/constants';

const BIP84_TEST_MNEMONIC = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
const BIP84_MAINNET_ACCOUNT0_ADDRESS = 'bc1qcr8te4kr609gcawutmrza0j4xv80jy8z306fyu';

describe('BitcoinAdapter - HD derivation and resolveAccountRaw', () => {
  const { switchNetwork } = useNetworks();
  const adapter = new BitcoinAdapter();
  const seed = mnemonicToSeedSync(BIP84_TEST_MNEMONIC);

  beforeEach(() => {
    switchNetwork(NETWORK_NAME_MAINNET);
  });

  it('derives independent addresses per account index (path m/84\'/0\'/i\'/0/0)', () => {
    const acc0 = adapter.getHdWalletAccountFromMnemonicSeed(seed, 0);
    const acc1 = adapter.getHdWalletAccountFromMnemonicSeed(seed, 1);

    expect(acc0.address).toBe(BIP84_MAINNET_ACCOUNT0_ADDRESS);
    expect(acc1.address).not.toBe(acc0.address);
    expect(acc0.publicKey).toBeInstanceOf(Uint8Array);
    expect(acc0.secretKey).toBeInstanceOf(Uint8Array);
    // A BIP32 private key is exactly 32 bytes.
    expect(acc0.secretKey.length).toBe(32);
  });

  it('resolveAccountRaw for an hdWallet-type raw account matches direct HD derivation', () => {
    const hdAccount = adapter.getHdWalletAccountFromMnemonicSeed(seed, 0);
    const resolved = adapter.resolveAccountRaw(
      { type: ACCOUNT_TYPES.hdWallet } as any,
      0,
      0,
      seed,
    );

    expect(resolved?.address).toBe(hdAccount.address);
  });

  it('resolveAccountRaw for a privateKey-type raw account derives a valid p2wpkh address and strips the raw key', () => {
    const priv = Buffer.from(new Uint8Array(32).fill(9));
    const raw = { type: ACCOUNT_TYPES.privateKey, privateKey: priv } as any;
    const res = adapter.resolveAccountRaw(raw, 0, 0);

    expect(res?.address).toBeDefined();
    expect(adapter.isAccountAddressValid(res!.address as string)).toBe(true);
    expect(res?.publicKey?.length).toBeGreaterThan(0);
    expect(res?.secretKey?.length).toBe(32);
    // The raw private key must not leak back out on the resolved account object.
    expect(res?.privateKey).toBeUndefined();
  });

  it('returns null for an unsupported/unknown raw account type', () => {
    const res = adapter.resolveAccountRaw({ type: 'unknown' } as any, 0, 0);
    expect(res).toBeNull();
  });

  it('returns null for an hdWallet-type raw account when no seed is provided', () => {
    const res = adapter.resolveAccountRaw({ type: ACCOUNT_TYPES.hdWallet } as any, 0, 0);
    expect(res).toBeNull();
  });
});
