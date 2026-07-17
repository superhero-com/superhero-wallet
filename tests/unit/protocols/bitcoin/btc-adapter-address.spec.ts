import { mnemonicToSeedSync } from '@scure/bip39';

import { BitcoinAdapter } from '@/protocols/bitcoin/libs/BitcoinAdapter';
import { useNetworks } from '@/composables/networks';
import {
  NETWORK_NAME_MAINNET,
  NETWORK_NAME_TESTNET,
  NETWORK_TYPE_MAINNET,
  NETWORK_TYPE_TESTNET,
} from '@/constants';

/**
 * A well-known, safe-to-use BIP-39 test mnemonic. BIP-84 (native segwit)
 * publishes a test vector for this exact mnemonic (empty passphrase),
 * account 0, mainnet, path m/84'/0'/0'/0/0:
 *   first receiving address = bc1qcr8te4kr609gcawutmrza0j4xv80jy8z306fyu
 * This is used as an external source-of-truth cross-check -- NOT derived by
 * running this repo's code and pasting its own output back as "expected".
 */
const BIP84_TEST_MNEMONIC = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
const BIP84_MAINNET_ACCOUNT0_ADDRESS = 'bc1qcr8te4kr609gcawutmrza0j4xv80jy8z306fyu';

describe('BitcoinAdapter - address derivation vs published BIP-84 vector', () => {
  const { switchNetwork } = useNetworks();
  const adapter = new BitcoinAdapter();
  const seed = mnemonicToSeedSync(BIP84_TEST_MNEMONIC);

  afterEach(() => {
    switchNetwork(NETWORK_NAME_MAINNET);
  });

  it('derives the exact address published in the BIP-84 test vector on mainnet, account index 0', () => {
    switchNetwork(NETWORK_NAME_MAINNET);
    const account = adapter.getHdWalletAccountFromMnemonicSeed(seed, 0);

    expect(account.address).toBe(BIP84_MAINNET_ACCOUNT0_ADDRESS);
  });

  it('mainnet and testnet derive DIFFERENT addresses for the very same seed and account index', () => {
    switchNetwork(NETWORK_NAME_MAINNET);
    const mainnetAccount = adapter.getHdWalletAccountFromMnemonicSeed(seed, 0);

    switchNetwork(NETWORK_NAME_TESTNET);
    const testnetAccount = adapter.getHdWalletAccountFromMnemonicSeed(seed, 0);

    // No published testnet vector for this mnemonic was found, so we fall back
    // to the minimum safe assertion: the two networks must never produce the
    // same address for the same key material (that would be a critical
    // cross-network key-reuse bug).
    expect(testnetAccount.address).not.toBe(mainnetAccount.address);
    expect(mainnetAccount.address).toBe(BIP84_MAINNET_ACCOUNT0_ADDRESS);
  });

  it('uses the expected bech32 human-readable prefix per network (bc1 mainnet / tb1 testnet)', () => {
    switchNetwork(NETWORK_NAME_MAINNET);
    expect(adapter.getAccountPrefix()).toBe('bc1q');
    const mainnetAccount = adapter.getHdWalletAccountFromMnemonicSeed(seed, 0);
    expect(mainnetAccount.address.startsWith('bc1')).toBe(true);

    switchNetwork(NETWORK_NAME_TESTNET);
    expect(adapter.getAccountPrefix()).toBe('tb1q');
    const testnetAccount = adapter.getHdWalletAccountFromMnemonicSeed(seed, 0);
    expect(testnetAccount.address.startsWith('tb1')).toBe(true);
  });

  it('accepts a valid mainnet address it derived itself', () => {
    switchNetwork(NETWORK_NAME_MAINNET);
    expect(
      adapter.isAccountAddressValid(BIP84_MAINNET_ACCOUNT0_ADDRESS, NETWORK_TYPE_MAINNET),
    ).toBe(true);
    expect(
      adapter.isValidAddressOrNameEncoding(BIP84_MAINNET_ACCOUNT0_ADDRESS, NETWORK_TYPE_MAINNET),
    ).toBe(true);
  });

  it('rejects garbage input as an address', () => {
    expect(adapter.isAccountAddressValid('not-a-btc-address')).toBe(false);
    expect(adapter.isAccountAddressValid('')).toBe(false);
  });

  it('rejects a mainnet address when validated against the testnet network type (no cross-network reuse)', () => {
    expect(
      adapter.isAccountAddressValid(BIP84_MAINNET_ACCOUNT0_ADDRESS, NETWORK_TYPE_TESTNET),
    ).toBe(false);
  });

  it('rejects a testnet address when validated against the mainnet network type', () => {
    switchNetwork(NETWORK_NAME_TESTNET);
    const testnetAccount = adapter.getHdWalletAccountFromMnemonicSeed(seed, 0);
    switchNetwork(NETWORK_NAME_MAINNET);

    expect(adapter.isAccountAddressValid(testnetAccount.address, NETWORK_TYPE_MAINNET)).toBe(false);
  });
});
