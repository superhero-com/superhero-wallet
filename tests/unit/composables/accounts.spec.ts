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

import {
  PROTOCOLS,
  ACCOUNT_TYPES,
  MODAL_PROTOCOL_SELECT,
  STORAGE_KEYS,
} from '@/constants';
import { WalletStorage } from '@/lib/WalletStorage';
import { watchUntilTruthy } from '@/utils';
import { generateEncryptionKey, generateSalt, encrypt } from '@/utils/crypto';
import en from '@/popup/locales/en-US.json';

const VALID_MNEMONIC = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
const MNEMONIC_SEED = mnemonicToSeedSync(VALID_MNEMONIC);
// 32 bytes, well below the secp256k1 curve order - a valid Ethereum private key.
const IMPORTED_ETH_PRIVATE_KEY_HEX = 'aa'.repeat(32);
const SECOND_ETH_PRIVATE_KEY_HEX = 'bb'.repeat(32);

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
  let isAuthenticatedRef;
  let encryptionKeyRef;
  let openModalMock;
  let openConfirmModalMock;

  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();

    mnemonicSeedRef = ref(MNEMONIC_SEED);
    isMnemonicRestoredRef = ref(true);
    isAuthenticatedRef = ref(false);
    encryptionKeyRef = ref(undefined);
    openModalMock = vi.fn().mockRejectedValue(new Error('No modals in this test'));
    openConfirmModalMock = vi.fn().mockRejectedValue(new Error('Dismissed'));
    vi.doMock('@/composables/modals', async (importOriginal) => {
      const actual = await importOriginal();
      return {
        ...actual,
        useModals: () => ({
          ...actual.useModals(),
          openModal: openModalMock,
          openConfirmModal: openConfirmModalMock,
        }),
      };
    });

    // Must be registered before any dynamic import below - `registerAdapters` and the
    // `@/composables` barrel eagerly load `accounts.ts`, which imports `useAuth` from
    // the barrel; mocking afterwards would be too late.
    vi.doMock('@/composables/auth', () => ({
      useAuth: () => ({
        mnemonic: ref(''),
        mnemonicSeed: mnemonicSeedRef,
        isMnemonicRestored: isMnemonicRestoredRef,
        isAuthenticated: isAuthenticatedRef,
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

  it('waits for a last active imported account instead of handing out another one of its protocol', async () => {
    seedAccountsRaw([
      { isRestored: true, protocol: PROTOCOLS.aeternity, type: ACCOUNT_TYPES.hdWallet },
      { isRestored: true, protocol: PROTOCOLS.ethereum, type: ACCOUNT_TYPES.hdWallet },
    ]);
    const key = await seedImportedEthAccount({
      type: ACCOUNT_TYPES.privateKey,
      isRestored: false,
      protocol: PROTOCOLS.ethereum,
      privateKey: Buffer.from(IMPORTED_ETH_PRIVATE_KEY_HEX, 'hex'),
    });
    WalletStorage.set(STORAGE_KEYS.protocolLastActiveAccountIdx, { [PROTOCOLS.ethereum]: 2 });

    const accounts = await boot();
    await watchUntilTruthy(accounts.areAccountsRestored);
    await flushAsync();
    expect(accounts.accounts.value).toHaveLength(2);
    expect(accounts.getLastActiveProtocolAccount(PROTOCOLS.ethereum)).toBeUndefined();

    encryptionKeyRef.value = key;
    expect(await watchUntilTruthy(
      () => accounts.getLastActiveProtocolAccount(PROTOCOLS.ethereum),
      5000,
    )).toMatchObject({ globalIdx: 2, type: ACCOUNT_TYPES.privateKey });
  });

  describe('imported private keys that cannot be decrypted', () => {
    const seedAccount = {
      isRestored: true,
      protocol: PROTOCOLS.aeternity,
      type: ACCOUNT_TYPES.hdWallet,
    };
    const importedRaw = {
      type: ACCOUNT_TYPES.privateKey,
      isRestored: false,
      protocol: PROTOCOLS.ethereum,
      privateKey: Buffer.from(IMPORTED_ETH_PRIVATE_KEY_HEX, 'hex'),
    };
    const secondImportedRaw = {
      ...importedRaw,
      privateKey: Buffer.from(SECOND_ETH_PRIVATE_KEY_HEX, 'hex'),
    };
    let storedCiphertext;
    let readingKey;
    let currentKey;
    let warnSpy;

    beforeEach(() => {
      // Each failed decrypt is reported.
      warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
      warnSpy.mockRestore();
    });

    /** Imported keys stored under a key whose salt is gone, e.g. a cut-off password change. */
    async function bootUnreadable(seedAccounts = [seedAccount]) {
      seedAccountsRaw(seedAccounts);
      readingKey = await seedImportedEthAccount(importedRaw);
      storedCiphertext = WalletStorage.get(STORAGE_KEYS.privateKeyAccountsRaw);
      currentKey = await generateEncryptionKey('another-password', generateSalt());
      encryptionKeyRef.value = currentKey;
      isAuthenticatedRef.value = true;
      const accounts = await boot();
      expect(await watchUntilTruthy(accounts.areAccountsReady, 5000)).toBe(true);
      return accounts;
    }

    function storedPrivateKeyAccounts() {
      return WalletStorage.get(STORAGE_KEYS.privateKeyAccountsRaw);
    }

    function accountTypes(accounts) {
      return accounts.accounts.value.map(({ type }) => type);
    }

    async function attemptImport(accounts) {
      const { ImportedAccountsUnreadableError } = await import('@/lib/errors');
      await expect(accounts.addPrivateKeyAccount(secondImportedRaw))
        .rejects.toBeInstanceOf(ImportedAccountsUnreadableError);
    }

    /** Returns the click on the offer's remove button. */
    function deferConfirm() {
      let confirm;
      openConfirmModalMock.mockImplementation(
        () => new Promise((resolve) => { confirm = resolve; }),
      );
      return () => confirm();
    }

    it('opens the wallet with the seed accounts, and keeps the imported ones stored', async () => {
      const accounts = await bootUnreadable();
      await flushAsync();

      expect(accounts.areAccountsReady.value).toBe(true);
      expect(accountTypes(accounts)).toEqual([ACCOUNT_TYPES.hdWallet]);
      expect(storedPrivateKeyAccounts()).toBe(storedCiphertext);
      expect(openConfirmModalMock).not.toHaveBeenCalled();
    });

    it('hands out the first account of a protocol whose last active one is among them', async () => {
      WalletStorage.set(STORAGE_KEYS.protocolLastActiveAccountIdx, { [PROTOCOLS.ethereum]: 2 });
      const accounts = await bootUnreadable([
        seedAccount,
        { ...seedAccount, protocol: PROTOCOLS.ethereum },
      ]);

      expect(accounts.getLastActiveProtocolAccount(PROTOCOLS.ethereum))
        .toMatchObject({ globalIdx: 1, type: ACCOUNT_TYPES.hdWallet });
    });

    it('refuses to import a private key over them, and offers to remove them', async () => {
      const accounts = await bootUnreadable();

      await attemptImport(accounts);
      await flushAsync();

      expect(openConfirmModalMock).toHaveBeenCalledTimes(1);
      expect(openConfirmModalMock).toHaveBeenCalledWith(expect.objectContaining({
        title: en.modals.unreadablePrivateKeyAccounts.title,
        icon: 'critical',
      }));
      expect(storedPrivateKeyAccounts()).toBe(storedCiphertext);
    });

    it('removes them when confirmed, and imports work again after', async () => {
      // The imported account, right after the seed one, was the last active one for Ethereum.
      WalletStorage.set(STORAGE_KEYS.protocolLastActiveAccountIdx, {
        [PROTOCOLS.aeternity]: 0,
        [PROTOCOLS.ethereum]: 1,
      });
      openConfirmModalMock.mockResolvedValue(undefined);
      const accounts = await bootUnreadable();

      await attemptImport(accounts);
      await flushAsync();
      expect(storedPrivateKeyAccounts()).toBeNull();
      expect(WalletStorage.get(STORAGE_KEYS.protocolLastActiveAccountIdx))
        .toEqual({ [PROTOCOLS.aeternity]: 0 });

      accounts.addRawAccount(seedAccount);
      await accounts.addPrivateKeyAccount(secondImportedRaw);

      expect(accountTypes(accounts))
        .toEqual([ACCOUNT_TYPES.hdWallet, ACCOUNT_TYPES.hdWallet, ACCOUNT_TYPES.privateKey]);
      expect(accounts.getLastActiveProtocolAccount(PROTOCOLS.ethereum))
        .toMatchObject({ protocol: PROTOCOLS.ethereum, type: ACCOUNT_TYPES.privateKey });
    });

    it('keeps them when the offer is dismissed, and offers again on the next import', async () => {
      const accounts = await bootUnreadable();

      await attemptImport(accounts);
      await flushAsync();
      await attemptImport(accounts);
      await flushAsync();

      expect(openConfirmModalMock).toHaveBeenCalledTimes(2);
      expect(storedPrivateKeyAccounts()).toBe(storedCiphertext);
      expect(accountTypes(accounts)).toEqual([ACCOUNT_TYPES.hdWallet]);
    });

    it('keeps them when the wallet got locked before the offer was confirmed', async () => {
      const confirm = deferConfirm();
      const accounts = await bootUnreadable();
      await attemptImport(accounts);

      // As `logout` does.
      encryptionKeyRef.value = undefined;
      isAuthenticatedRef.value = false;
      confirm();
      await flushAsync();

      expect(storedPrivateKeyAccounts()).toBe(storedCiphertext);
    });

    it('keeps them when they became readable before the offer was confirmed', async () => {
      const confirm = deferConfirm();
      const accounts = await bootUnreadable();
      await attemptImport(accounts);

      encryptionKeyRef.value = readingKey;
      expect(await watchUntilTruthy(() => accounts.accounts.value.length === 2, 5000)).toBe(true);
      confirm();
      await flushAsync();

      expect(storedPrivateKeyAccounts()).toBe(storedCiphertext);
      expect(accounts.accounts.value).toHaveLength(2);
    });

    it('takes over the ones another context stored meanwhile instead of removing them', async () => {
      const confirm = deferConfirm();
      const accounts = await bootUnreadable();
      await attemptImport(accounts);

      // E.g. the offscreen tab re-encrypted them under the current key.
      const rescued = await encrypt(currentKey, JSON.stringify([importedRaw]));
      WalletStorage.set(STORAGE_KEYS.privateKeyAccountsRaw, rescued);
      confirm();

      expect(await watchUntilTruthy(() => accounts.accounts.value.length === 2, 5000)).toBe(true);
      expect(storedPrivateKeyAccounts()).toBe(rescued);
    });

    it('accepts imports when another context removed them before the offer was confirmed', async () => {
      const confirm = deferConfirm();
      const accounts = await bootUnreadable();
      await attemptImport(accounts);

      WalletStorage.set(STORAGE_KEYS.privateKeyAccountsRaw, null);
      confirm();
      await flushAsync();

      await expect(accounts.addPrivateKeyAccount(secondImportedRaw)).resolves.toBe(1);
    });

    it('accepts imports again once a key that decrypts them arrives', async () => {
      const accounts = await bootUnreadable();

      encryptionKeyRef.value = readingKey;
      expect(await watchUntilTruthy(() => accounts.accounts.value.length === 2, 5000)).toBe(true);
      await accounts.addPrivateKeyAccount(secondImportedRaw);

      expect(accountTypes(accounts))
        .toEqual([ACCOUNT_TYPES.hdWallet, ACCOUNT_TYPES.privateKey, ACCOUNT_TYPES.privateKey]);
      expect(openConfirmModalMock).not.toHaveBeenCalled();
    });

    it('accepts imports again after a reset', async () => {
      const accounts = await bootUnreadable();

      accounts.resetAccounts();
      await flushAsync();
      expect(accounts.areAccountsReady.value).toBe(true);

      accounts.addRawAccount(seedAccount);
      await expect(accounts.addPrivateKeyAccount(secondImportedRaw)).resolves.toBe(1);
      expect(accountTypes(accounts)).toEqual([ACCOUNT_TYPES.hdWallet, ACCOUNT_TYPES.privateKey]);
    });
  });

  describe('discoverAccounts', () => {
    /**
     * Every adapter reports `lastUsedIndex` (or none) once the returned `release` is called;
     * the `stalled` ones never report.
     */
    async function stubDiscovery(lastUsedIndex, stalled = []) {
      const { ProtocolAdapterFactory } = await import('@/lib/ProtocolAdapterFactory');
      const { PROTOCOL_LIST } = await import('@/constants');
      let release;
      const released = new Promise((resolve) => { release = resolve; });
      PROTOCOL_LIST.forEach((protocol) => {
        vi.spyOn(ProtocolAdapterFactory.getAdapter(protocol), 'discoverLastUsedAccountIndex')
          .mockImplementation(() => (stalled.includes(protocol)
            ? new Promise(() => {})
            : released.then(() => lastUsedIndex[protocol] ?? -1)));
      });
      return release;
    }

    it('waits for the discovery when no timeout is given', async () => {
      const accounts = await boot();
      await watchUntilTruthy(accounts.areAccountsRestored);
      const release = await stubDiscovery({ [PROTOCOLS.aeternity]: 0 });
      let isSettled = false;
      const discovering = accounts.discoverAccounts().finally(() => { isSettled = true; });

      await flushAsync();
      expect(isSettled).toBe(false);
      release();

      await expect(discovering).resolves.toBe(true);
      expect(accounts.accounts.value.map(({ protocol }) => protocol))
        .toEqual([PROTOCOLS.aeternity]);
    });

    it('adds the found accounts when the discovery finishes in time', async () => {
      const accounts = await boot();
      await watchUntilTruthy(accounts.areAccountsRestored);
      const release = await stubDiscovery({ [PROTOCOLS.aeternity]: 1 });
      release();

      await expect(accounts.discoverAccounts({ timeout: 1000 })).resolves.toBe(true);
      expect(accounts.accounts.value.map(({ protocol }) => protocol))
        .toEqual([PROTOCOLS.aeternity, PROTOCOLS.aeternity]);
    });

    it('adds nothing when it times out, even once the discovery finishes later', async () => {
      const accounts = await boot();
      await watchUntilTruthy(accounts.areAccountsRestored);
      const release = await stubDiscovery({ [PROTOCOLS.aeternity]: 1 });

      await expect(accounts.discoverAccounts({ timeout: 10 })).resolves.toBe(false);
      release();
      await flushAsync();

      expect(accounts.accounts.value).toEqual([]);
    });

    it('asks for a protocol when a complete discovery finds nothing', async () => {
      const accounts = await boot();
      await watchUntilTruthy(accounts.areAccountsRestored);
      const release = await stubDiscovery({});
      release();
      openModalMock.mockResolvedValueOnce(PROTOCOLS.ethereum);

      await expect(accounts.discoverAccounts({ timeout: 1000 })).resolves.toBe(true);
      expect(openModalMock).toHaveBeenCalledWith(MODAL_PROTOCOL_SELECT, expect.anything());
      expect(accounts.accounts.value.map(({ protocol }) => protocol))
        .toEqual([PROTOCOLS.ethereum]);
    });

    it('does not ask for a protocol when the discovery that found nothing was cut short', async () => {
      const accounts = await boot();
      await watchUntilTruthy(accounts.areAccountsRestored);
      await stubDiscovery({});

      await expect(accounts.discoverAccounts({ timeout: 10 })).resolves.toBe(false);
      expect(openModalMock).not.toHaveBeenCalled();
    });

    it('keeps the protocols that finished when another one times out', async () => {
      const accounts = await boot();
      await watchUntilTruthy(accounts.areAccountsRestored);
      const release = await stubDiscovery({ [PROTOCOLS.aeternity]: 1 }, [PROTOCOLS.ethereum]);
      release();

      await expect(accounts.discoverAccounts({ timeout: 10 })).resolves.toBe(false);
      expect(accounts.accounts.value.map(({ protocol }) => protocol))
        .toEqual([PROTOCOLS.aeternity, PROTOCOLS.aeternity]);
    });
  });
});
