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
import {
  generateEncryptionKey,
  generateSalt,
  encodeBase64,
  encrypt,
  decrypt,
  importEncryptionKey,
} from '@/utils/crypto';
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
  let isMnemonicUnreadableRef;
  let encryptionKeyRef;
  let openModalMock;
  let openConfirmModalMock;

  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();

    mnemonicSeedRef = ref(MNEMONIC_SEED);
    isMnemonicRestoredRef = ref(true);
    isAuthenticatedRef = ref(false);
    isMnemonicUnreadableRef = ref(false);
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
        isMnemonicUnreadable: isMnemonicUnreadableRef,
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

  it('is ready without the imported accounts when the seed could not be read, so the reset can be offered', async () => {
    await seedImportedEthAccount({
      type: ACCOUNT_TYPES.privateKey,
      isRestored: false,
      protocol: PROTOCOLS.ethereum,
      privateKey: Buffer.from(IMPORTED_ETH_PRIVATE_KEY_HEX, 'hex'),
    });
    mnemonicSeedRef.value = null;
    isMnemonicUnreadableRef.value = true;

    const accounts = await boot();

    expect(await watchUntilTruthy(accounts.areAccountsReady, 1000)).toBe(true);
    expect(accounts.accounts.value).toEqual([]);
    expect(accounts.isLoggedIn.value).toBe(false);
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

  describe('imported private keys that cannot be decrypted or read', () => {
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

    describe('whose read rejects at startup', () => {
      let readStored;
      let failedRead;

      afterEach(() => {
        vi.doUnmock('@/constants');
      });

      /**
       * Readable with the current key, but the read fails, e.g. an Android Keystore error.
       * With `isReadFailing: false` the read works, but they are under another key.
       * With `isLegacyPlaintext` they are stored unencrypted, as before the mobile encryption.
       */
      async function bootWithFailingRead({
        isMobile = false,
        isReadFailing = true,
        isLegacyPlaintext = false,
      } = {}) {
        if (isMobile) {
          vi.doMock('@/constants', async (importOriginal) => ({
            ...await importOriginal(),
            IS_MOBILE_APP: true,
          }));
        }
        const { SecureMobileStorage } = await import('@/lib/SecureMobileStorage');
        const { WalletStorage: walletStorage } = await import('@/lib/WalletStorage');
        const storage = isMobile ? SecureMobileStorage : walletStorage;
        seedAccountsRaw([seedAccount]);
        if (isLegacyPlaintext) {
          // The per-install key, which the mobile encryption migration encrypts with
          const rawKey = globalThis.crypto.getRandomValues(new Uint8Array(32));
          await storage.set(STORAGE_KEYS.mobileDataKey, encodeBase64(rawKey));
          currentKey = await importEncryptionKey(rawKey);
          storedCiphertext = JSON.stringify([importedRaw]);
        } else {
          currentKey = await generateEncryptionKey('test-password', generateSalt());
          storedCiphertext = await encrypt(currentKey, JSON.stringify([importedRaw]));
        }
        await storage.set(STORAGE_KEYS.privateKeyAccountsRaw, storedCiphertext);
        encryptionKeyRef.value = isReadFailing
          ? currentKey
          : await generateEncryptionKey('another-password', generateSalt());
        isAuthenticatedRef.value = true;
        const realGet = storage.get;
        readStored = () => realGet(STORAGE_KEYS.privateKeyAccountsRaw);
        failedRead = vi.spyOn(storage, 'get').mockImplementation((key) => {
          if (key !== STORAGE_KEYS.privateKeyAccountsRaw || !isReadFailing) return realGet(key);
          if (isMobile) return Promise.reject(new Error('osError'));
          throw new SyntaxError('Unexpected end of JSON input');
        });
        const accounts = await boot();
        expect(await watchUntilTruthy(accounts.areAccountsReady, 5000)).toBe(true);
        return accounts;
      }

      it.each([
        // A corrupt entry, which reopening doesn't fix
        ['web', false, en.modals.unreadablePrivateKeyAccounts.msg],
        ['mobile', true, en.modals.unreadablePrivateKeyAccounts.readFailedMsg],
      ])('opens the wallet on %s and refuses imports over them, keeping them stored', async (_, isMobile, msg) => {
        const accounts = await bootWithFailingRead({ isMobile });

        await attemptImport(accounts);
        await flushAsync();

        expect(accountTypes(accounts)).toEqual([ACCOUNT_TYPES.hdWallet]);
        expect(openConfirmModalMock).toHaveBeenCalledWith(expect.objectContaining({
          title: en.modals.unreadablePrivateKeyAccounts.title,
          msg,
        }));
        expect(await readStored()).toBe(storedCiphertext);
      });

      it('says on mobile that they can\'t be decrypted when they were read', async () => {
        const accounts = await bootWithFailingRead({ isMobile: true, isReadFailing: false });

        await attemptImport(accounts);

        expect(openConfirmModalMock).toHaveBeenCalledWith(expect.objectContaining({
          msg: en.modals.unreadablePrivateKeyAccounts.msg,
        }));
      });

      it.each([
        ['web', false],
        ['mobile', true],
      ])('takes them back on %s when they read fine once the removal is confirmed', async (_, isMobile) => {
        const confirm = deferConfirm();
        const accounts = await bootWithFailingRead({ isMobile });
        await attemptImport(accounts);

        failedRead.mockRestore();
        confirm();

        expect(await watchUntilTruthy(() => accounts.accounts.value.length === 2, 5000)).toBe(true);
        expect(await readStored()).toBe(storedCiphertext);
        await accounts.addPrivateKeyAccount(secondImportedRaw);
        expect(accountTypes(accounts))
          .toEqual([ACCOUNT_TYPES.hdWallet, ACCOUNT_TYPES.privateKey, ACCOUNT_TYPES.privateKey]);
      });

      it('takes them back on mobile when they read fine as plaintext from before the encryption', async () => {
        const confirm = deferConfirm();
        const accounts = await bootWithFailingRead({ isMobile: true, isLegacyPlaintext: true });
        await attemptImport(accounts);

        failedRead.mockRestore();
        confirm();

        expect(await watchUntilTruthy(() => accounts.accounts.value.length === 2, 5000)).toBe(true);
        // Encrypted as the startup would have done
        await vi.waitFor(async () => {
          const stored = JSON.parse(await decrypt(currentKey, await readStored()));
          expect(stored).toEqual(JSON.parse(JSON.stringify([importedRaw])));
        }, { timeout: 5000 });
      });

      it.each([
        ['web', false],
        ['mobile', true],
      ])('removes them on %s when confirmed while the read still fails, and imports work again', async (_, isMobile) => {
        openConfirmModalMock.mockResolvedValue(undefined);
        const accounts = await bootWithFailingRead({ isMobile });

        await attemptImport(accounts);
        await flushAsync();
        await accounts.addPrivateKeyAccount(secondImportedRaw);

        expect(accountTypes(accounts)).toEqual([ACCOUNT_TYPES.hdWallet, ACCOUNT_TYPES.privateKey]);
        await vi.waitFor(async () => {
          const stored = JSON.parse(await decrypt(currentKey, await readStored()));
          expect(stored).toEqual(JSON.parse(JSON.stringify([secondImportedRaw])));
        }, { timeout: 5000 });
      });
    });
  });

  it('derives the published addresses from imported private keys, also after a restart', async () => {
    const { PRIVATE_KEY_VECTORS } = await import('../../fixtures/privateKeyVectors');
    seedAccountsRaw([
      { isRestored: true, protocol: PROTOCOLS.aeternity, type: ACCOUNT_TYPES.hdWallet },
    ]);
    encryptionKeyRef.value = await generateEncryptionKey('test-password', generateSalt());
    isAuthenticatedRef.value = true;
    const importedAddresses = ({ accounts: list }) => list.value
      .filter(({ type }) => type === ACCOUNT_TYPES.privateKey)
      .map(({ protocol, address }) => [protocol, address]);
    const expected = PRIVATE_KEY_VECTORS.map(([protocol, , address]) => [protocol, address]);
    const accounts = await boot();
    expect(await watchUntilTruthy(accounts.areAccountsReady, 5000)).toBe(true);

    // eslint-disable-next-line no-restricted-syntax
    for (const [protocol, privateKeyHex] of PRIVATE_KEY_VECTORS) {
      // eslint-disable-next-line no-await-in-loop
      await accounts.addPrivateKeyAccount({
        type: ACCOUNT_TYPES.privateKey,
        isRestored: false,
        protocol,
        privateKey: Buffer.from(privateKeyHex, 'hex'),
      });
    }
    expect(importedAddresses(accounts)).toEqual(expected);

    vi.resetModules();
    const restarted = await boot();
    // Decrypting and deriving every protocol takes a while in a full run.
    await vi.waitFor(() => expect(importedAddresses(restarted)).toEqual(expected), 5000);
  });

  describe('discoverAccounts', () => {
    const AE = PROTOCOLS.aeternity;
    const ETH = PROTOCOLS.ethereum;

    /**
     * Stubs each protocol's node with `isUsed(protocol, index)`, which may also throw or
     * never settle. Its checks answer once the returned `release` is called.
     */
    async function stubNodes(isUsed) {
      const { ProtocolAdapterFactory } = await import('@/lib/ProtocolAdapterFactory');
      const { PROTOCOL_LIST } = await import('@/constants');
      let release;
      const released = new Promise((resolve) => { release = resolve; });
      PROTOCOL_LIST.forEach((protocol) => {
        const adapter = ProtocolAdapterFactory.getAdapter(protocol);
        // Derived once each, as the checks of a scan ask for the same addresses.
        const indexByAddress = new Map();
        const indexOf = (address) => {
          while (!indexByAddress.has(address)) {
            if (indexByAddress.size >= 20) throw new Error(`Unknown ${protocol} address ${address}`);
            const { address: derived } = adapter
              .getHdWalletAccountFromMnemonicSeed(MNEMONIC_SEED, indexByAddress.size);
            indexByAddress.set(derived, indexByAddress.size);
          }
          return indexByAddress.get(address);
        };
        vi.spyOn(adapter, 'isAccountUsed').mockImplementation(async (address) => {
          await released;
          return isUsed(protocol, indexOf(address));
        });
      });
      return release;
    }

    const usedUpTo = (lastUsedIndex) => (protocol, index) => (
      index <= (lastUsedIndex[protocol] ?? -1)
    );
    const stalled = () => new Promise(() => {});
    const protocolsOf = ({ accounts: list }) => list.value.map(({ protocol }) => protocol);

    async function bootRestored() {
      const accounts = await boot();
      await watchUntilTruthy(accounts.areAccountsRestored);
      return accounts;
    }

    it('waits for the nodes to answer', async () => {
      const accounts = await bootRestored();
      const release = await stubNodes(usedUpTo({ [AE]: 0 }));
      let isSettled = false;
      const discovering = accounts.discoverAccounts().finally(() => { isSettled = true; });

      await flushAsync();
      expect(isSettled).toBe(false);
      release();

      await expect(discovering).resolves.toBe(true);
      expect(protocolsOf(accounts)).toEqual([AE]);
    });

    it('adds the found accounts', async () => {
      const accounts = await bootRestored();
      const release = await stubNodes(usedUpTo({ [AE]: 1 }));
      release();

      await expect(accounts.discoverAccounts()).resolves.toBe(true);
      expect(protocolsOf(accounts)).toEqual([AE, AE]);
    });

    it('asks for a protocol when a complete discovery finds nothing', async () => {
      const accounts = await bootRestored();
      const release = await stubNodes(usedUpTo({}));
      release();
      openModalMock.mockResolvedValueOnce(ETH);

      await expect(accounts.discoverAccounts()).resolves.toBe(true);
      expect(openModalMock).toHaveBeenCalledWith(MODAL_PROTOCOL_SELECT, expect.anything());
      expect(protocolsOf(accounts)).toEqual([ETH]);
    });

    it('opens the first æternity account when no protocol is chosen for an unused seed', async () => {
      const accounts = await bootRestored();
      const release = await stubNodes(usedUpTo({}));
      release();

      await expect(accounts.discoverAccounts()).resolves.toBe(true);
      expect(openModalMock).toHaveBeenCalledWith(MODAL_PROTOCOL_SELECT, expect.anything());
      expect(protocolsOf(accounts)).toEqual([AE]);
    });

    it.each([
      ['before finding any', () => { throw new Error('network down'); }, [AE]],
      ['after finding two', (index) => {
        if (index === 2) throw new Error('network down');
        return index < 2;
      }, [ETH, ETH]],
      ['and finds the ones after the failed check', (index) => {
        if (index === 2) throw new Error('network down');
        return [0, 1, 3, 6].includes(index);
      }, Array(7).fill(ETH)],
    ])('counts a failed check %s as incomplete, keeping the accounts found', async (_, isEthUsed, protocols) => {
      const accounts = await bootRestored();
      const release = await stubNodes((protocol, index) => (
        (protocol === ETH) ? isEthUsed(index) : false
      ));
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      release();

      try {
        await expect(accounts.discoverAccounts()).resolves.toBe(false);
      } finally {
        warnSpy.mockRestore();
      }
      // It may have missed accounts, so no protocol is asked for.
      expect(openModalMock).not.toHaveBeenCalled();
      expect(protocolsOf(accounts)).toEqual(protocols);
    });

    describe('when a node stops answering', () => {
      beforeEach(() => {
        vi.doMock('@/constants', async (importOriginal) => ({
          ...await importOriginal(),
          ACCOUNT_CHECK_TIMEOUT: 10,
        }));
      });

      afterEach(() => {
        vi.doUnmock('@/constants');
      });

      it('keeps the accounts confirmed before', async () => {
        const accounts = await bootRestored();
        // The first 5 æternity accounts are used, then its node stops answering.
        const release = await stubNodes((protocol, index) => (
          (protocol === AE && index >= 5) ? stalled() : protocol === AE
        ));
        release();

        await expect(accounts.discoverAccounts()).resolves.toBe(false);
        expect(protocolsOf(accounts)).toEqual([AE, AE, AE, AE, AE]);
      });

      it('opens the first æternity account, not asking for a protocol', async () => {
        const accounts = await bootRestored();
        const release = await stubNodes(stalled);
        release();

        await expect(accounts.discoverAccounts()).resolves.toBe(false);
        expect(openModalMock).not.toHaveBeenCalled();
        expect(protocolsOf(accounts)).toEqual([AE]);
      });

      it('keeps the protocols that finished', async () => {
        const accounts = await bootRestored();
        const release = await stubNodes((protocol, index) => (
          (protocol === ETH) ? stalled() : usedUpTo({ [AE]: 1 })(protocol, index)
        ));
        release();

        await expect(accounts.discoverAccounts()).resolves.toBe(false);
        expect(protocolsOf(accounts)).toEqual([AE, AE]);
      });
    });
  });
});
