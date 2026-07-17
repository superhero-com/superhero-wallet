// @ts-nocheck
/**
 * Exercises `useAccounts` — the composable that merges HD-derived accounts with
 * imported private-key accounts and decides which account/address is "active"
 * (i.e. what a dApp or the UI sees). This is security-relevant: a wrong-protocol
 * or stale account exposed during restore could leak the wrong address.
 *
 * Only `@/composables/auth` is mocked (never the whole `@/composables` barrel —
 * that breaks `accounts.ts`'s own sibling imports, see `vitest.config.ts` /
 * `auth.mobile.spec.ts`). Mocking just the `auth` submodule lets us drive
 * `mnemonicSeed` / `isMnemonicRestored` / `encryptionKey` directly instead of
 * going through the full password/biometric login flow.
 *
 * Everything else runs for real: `useStorageRef` against jsdom `localStorage`,
 * the real protocol adapters (registered fresh each test via
 * `@/protocols/registerAdapters`, following the `accountAssetsList.spec.ts`
 * pattern), and real WebCrypto AES-GCM for the imported-private-key ciphertext.
 */
import { ref } from 'vue';
import { mnemonicToSeedSync } from '@scure/bip39';

import { PROTOCOLS, ACCOUNT_TYPES, STORAGE_KEYS } from '@/constants';
import { WalletStorage } from '@/lib/WalletStorage';
import { watchUntilTruthy } from '@/utils';
import { generateEncryptionKey, generateSalt, encrypt } from '@/utils/crypto';

const VALID_MNEMONIC = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
const MNEMONIC_SEED = mnemonicToSeedSync(VALID_MNEMONIC);
// 32 bytes, well below the secp256k1 curve order - a valid Ethereum private key.
const IMPORTED_ETH_PRIVATE_KEY_HEX = 'aa'.repeat(32);

function flushAsync() {
  return new Promise((resolve) => { setTimeout(resolve, 0); });
}

function seedAccountsRaw(accounts) {
  WalletStorage.set(STORAGE_KEYS.accountsRaw, accounts);
}

async function seedImportedEthAccount(rawAccount) {
  const key = await generateEncryptionKey('test-password', generateSalt());
  const ciphertext = await encrypt(key, JSON.stringify([rawAccount]));
  WalletStorage.set(STORAGE_KEYS.privateKeyAccountsRaw, ciphertext);
  return key;
}

describe('useAccounts', () => {
  let mnemonicSeedRef;
  let isMnemonicRestoredRef;
  let encryptionKeyRef;

  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();

    mnemonicSeedRef = ref(MNEMONIC_SEED);
    isMnemonicRestoredRef = ref(true);
    encryptionKeyRef = ref(undefined);

    // Must be registered before any dynamic import below - `registerAdapters` and the
    // `@/composables` barrel eagerly load `accounts.ts`, which imports `useAuth` from
    // the barrel; mocking afterwards would be too late.
    vi.doMock('@/composables/auth', () => ({
      useAuth: () => ({
        mnemonic: ref(''),
        mnemonicSeed: mnemonicSeedRef,
        isMnemonicRestored: isMnemonicRestoredRef,
        encryptionKey: encryptionKeyRef,
      }),
    }));
  });

  async function boot() {
    await import('@/protocols/registerAdapters');
    const { useAccounts } = await import('@/composables/accounts');
    return useAccounts();
  }

  it('merges HD and imported private-key accounts; activeAccountGlobalIdx resolves the right one', async () => {
    seedAccountsRaw([
      // globalIdx 0
      { isRestored: true, protocol: PROTOCOLS.aeternity, type: ACCOUNT_TYPES.hdWallet },
      // globalIdx 1
      { isRestored: true, protocol: PROTOCOLS.ethereum, type: ACCOUNT_TYPES.hdWallet },
    ]);
    const importedRaw = {
      type: ACCOUNT_TYPES.privateKey,
      isRestored: false,
      protocol: PROTOCOLS.ethereum,
      privateKey: Buffer.from(IMPORTED_ETH_PRIVATE_KEY_HEX, 'hex'),
    };
    const key = await seedImportedEthAccount(importedRaw); // globalIdx 2
    WalletStorage.set(STORAGE_KEYS.activeAccountGlobalIdx, 2);
    encryptionKeyRef.value = key;

    const accounts = await boot();
    await watchUntilTruthy(accounts.areAccountsReady);

    expect(accounts.accounts.value).toHaveLength(3);
    expect(accounts.accounts.value[0].protocol).toBe(PROTOCOLS.aeternity);
    expect(accounts.accounts.value[0].type).toBe(ACCOUNT_TYPES.hdWallet);
    expect(accounts.accounts.value[1].protocol).toBe(PROTOCOLS.ethereum);
    expect(accounts.accounts.value[1].type).toBe(ACCOUNT_TYPES.hdWallet);
    expect(accounts.accounts.value[2].protocol).toBe(PROTOCOLS.ethereum);
    expect(accounts.accounts.value[2].type).toBe(ACCOUNT_TYPES.privateKey);

    expect(accounts.activeAccountGlobalIdx.value).toBe(2);
    expect(accounts.activeAccount.value.globalIdx).toBe(2);
    expect(accounts.activeAccount.value.type).toBe(ACCOUNT_TYPES.privateKey);
    expect(accounts.activeAccount.value.address).toBeTruthy();
  });

  it('getLastActiveProtocolAccount never exposes a wrong-protocol account while restoring', async () => {
    // Deliberately order accounts so a naive "default index 0" shortcut would
    // point at the WRONG protocol (ethereum) for an aeternity lookup. The
    // persisted active index (1) and the persisted per-protocol last-active
    // index both genuinely point at the aeternity account.
    seedAccountsRaw([
      // globalIdx 0
      { isRestored: true, protocol: PROTOCOLS.ethereum, type: ACCOUNT_TYPES.hdWallet },
      // globalIdx 1
      { isRestored: true, protocol: PROTOCOLS.aeternity, type: ACCOUNT_TYPES.hdWallet },
    ]);
    WalletStorage.set(STORAGE_KEYS.activeAccountGlobalIdx, 1);
    WalletStorage.set(STORAGE_KEYS.protocolLastActiveAccountIdx, { [PROTOCOLS.aeternity]: 1 });

    const accounts = await boot();

    const wrongProtocolHits = [];
    for (let i = 0; i < 25; i += 1) {
      const result = accounts.getLastActiveProtocolAccount(PROTOCOLS.aeternity);
      if (result && result.protocol !== PROTOCOLS.aeternity) {
        wrongProtocolHits.push({ tick: i, globalIdx: result.globalIdx, protocol: result.protocol });
      }
      // eslint-disable-next-line no-await-in-loop
      await flushAsync();
    }

    expect(wrongProtocolHits).toEqual([]);

    // Once everything has settled it correctly resolves the persisted account.
    await watchUntilTruthy(accounts.areAccountsReady);
    expect(accounts.getLastActiveProtocolAccount(PROTOCOLS.aeternity)?.globalIdx).toBe(1);
  });

  it('drops an account whose protocol is no longer registered from the resolved list; setActiveAccountByGlobalIdx falls back to a valid account', async () => {
    seedAccountsRaw([
      // globalIdx 0
      { isRestored: true, protocol: PROTOCOLS.aeternity, type: ACCOUNT_TYPES.hdWallet },
      // globalIdx 1, unregistered protocol (e.g. removed in a branch)
      { isRestored: true, protocol: 'ghostchain', type: ACCOUNT_TYPES.hdWallet },
    ]);
    // active account is the one that gets dropped
    WalletStorage.set(STORAGE_KEYS.activeAccountGlobalIdx, 1);

    const accounts = await boot();
    await watchUntilTruthy(accounts.areAccountsRestored);
    await flushAsync();
    await flushAsync();

    expect(accounts.accounts.value).toHaveLength(1);
    expect(accounts.accounts.value[0].protocol).toBe(PROTOCOLS.aeternity);
    // Deliberate: unlike the sibling `else` branch in the `accounts` computed
    // (where `adapter.resolveAccountRaw` returns null for a REGISTERED
    // protocol - a genuinely corrupt entry - which *does*
    // `accountsRaw.value.splice(globalIdx, 1)`), the "protocol no longer
    // registered" early `return null` does NOT prune the orphaned entry from
    // `accountsRaw`. This is intentional, not a bug: an unregistered protocol
    // typically means the running build is simply missing that feature (a
    // version rollback, or a dev on a branch without it yet), not that the
    // user's account was ever invalid. Pruning it here would permanently
    // delete the account the first time the app runs without that protocol.
    // Keeping the entry dormant in storage (filtered out of the *computed*
    // `accounts` list only) preserves it for when the protocol returns.
    //
    // Separately, the sibling branch's own splice above has a latent hazard:
    // it indexes over the concatenated `[...accountsRaw, ...privateKeyAccountsRaw]`
    // array but splices `accountsRaw` alone, so a private-key account that
    // fails to resolve would splice the wrong element. Not covered here -
    // needs its own test and fix.
    expect(accounts.accountsRaw.value).toHaveLength(2);

    // The stale index left over from the removed account is NOT self-healed by
    // the composable's own reactivity - `activeAccount` just goes empty.
    expect(accounts.activeAccount.value).toEqual({});

    // The exposed re-sync API (used by callers like the router/Index.vue on
    // boot) falls back to a valid account when asked to re-target a removed idx.
    accounts.setActiveAccountByGlobalIdx(accounts.activeAccountGlobalIdx.value);
    expect(accounts.activeAccountGlobalIdx.value).toBe(0);
    expect(accounts.activeAccount.value.protocol).toBe(PROTOCOLS.aeternity);
  });

  it('exposes no imported private-key accounts while encryptionKey is unset, even with ciphertext on disk', async () => {
    seedAccountsRaw([
      { isRestored: true, protocol: PROTOCOLS.aeternity, type: ACCOUNT_TYPES.hdWallet },
    ]);
    const importedRaw = {
      type: ACCOUNT_TYPES.privateKey,
      isRestored: false,
      protocol: PROTOCOLS.ethereum,
      privateKey: Buffer.from(IMPORTED_ETH_PRIVATE_KEY_HEX, 'hex'),
    };
    await seedImportedEthAccount(importedRaw);
    // encryptionKeyRef is intentionally left unset - simulating a locked wallet.

    const accounts = await boot();
    await watchUntilTruthy(accounts.areAccountsRestored);
    await flushAsync();
    await flushAsync();
    await flushAsync();

    expect(accounts.accounts.value).toHaveLength(1);
    expect(accounts.accounts.value.every((a) => a.type !== ACCOUNT_TYPES.privateKey)).toBe(true);
    // Without a key to decrypt the on-disk ciphertext, the "ready" gate never
    // settles either - see the report for why this is likely intentional
    // (a locked wallet legitimately can't consider accounts fully ready).
    expect(accounts.areAccountsReady.value).toBe(false);
  });
});
