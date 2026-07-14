import { mnemonicToSeedSync } from '@scure/bip39';

import { EthereumAdapter } from '@/protocols/ethereum/libs/EthereumAdapter';
import { BitcoinAdapter } from '@/protocols/bitcoin/libs/BitcoinAdapter';
import { useNetworks } from '@/composables/networks';
import { NETWORK_NAME_MAINNET, NETWORK_NAME_TESTNET } from '@/constants';
import { TEST_ACCOUNT } from '../../fixtures/account';

/**
 * `getHdWalletAccountFromMnemonicSeed` is memoized in BaseProtocolAdapter for
 * performance (BIP32 derivation is expensive and the `accounts` computed can
 * recompute it on every read). These tests lock in the two ways that could
 * go wrong: the cache must actually hit for repeat (seed, index) lookups, and
 * it must NOT return a stale address for protocols whose derivation depends
 * on state beyond (seed, index) -- Bitcoin/Dogecoin's address encoding also
 * depends on the active network (mainnet vs testnet).
 */
describe('HD derivation memoization', () => {
  const seed = mnemonicToSeedSync(TEST_ACCOUNT.mnemonic);

  it('returns a cached result for a repeat (seed, index) call instead of re-deriving', () => {
    const adapter = new EthereumAdapter();
    const deriveSpy = vi.spyOn(adapter as any, 'deriveHdWalletAccountFromMnemonicSeed');

    const first = adapter.getHdWalletAccountFromMnemonicSeed(seed, 0);
    const second = adapter.getHdWalletAccountFromMnemonicSeed(seed, 0);

    expect(deriveSpy).toHaveBeenCalledTimes(1);
    expect(second).toBe(first); // same cached object reference, not just equal value
    expect(second.address).toBe(first.address);

    deriveSpy.mockRestore();
  });

  it('derives independently (no cross-contamination) per account index', () => {
    const adapter = new EthereumAdapter();
    const deriveSpy = vi.spyOn(adapter as any, 'deriveHdWalletAccountFromMnemonicSeed');

    const acc0 = adapter.getHdWalletAccountFromMnemonicSeed(seed, 0);
    const acc1 = adapter.getHdWalletAccountFromMnemonicSeed(seed, 1);

    expect(deriveSpy).toHaveBeenCalledTimes(2);
    expect(acc0.address).not.toBe(acc1.address);

    deriveSpy.mockRestore();
  });

  it('re-derives (does not return a stale cached address) when the active network changes', () => {
    const adapter = new BitcoinAdapter();
    const { switchNetwork } = useNetworks();

    switchNetwork(NETWORK_NAME_MAINNET);
    const mainnetAccount = adapter.getHdWalletAccountFromMnemonicSeed(seed, 0);
    expect(mainnetAccount.address.startsWith('bc1')).toBe(true);

    switchNetwork(NETWORK_NAME_TESTNET);
    const testnetAccount = adapter.getHdWalletAccountFromMnemonicSeed(seed, 0);
    expect(testnetAccount.address.startsWith('tb1')).toBe(true);

    // Switching back to mainnet must not have been permanently poisoned by the
    // testnet lookup, or vice versa -- both entries stay independently cached.
    switchNetwork(NETWORK_NAME_MAINNET);
    const mainnetAccountAgain = adapter.getHdWalletAccountFromMnemonicSeed(seed, 0);
    expect(mainnetAccountAgain.address).toBe(mainnetAccount.address);
  });
});
