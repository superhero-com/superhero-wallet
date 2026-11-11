// @ts-nocheck
import { watch } from 'vue';
import en from '@/popup/locales/en-US.json';
import { installSessionMutationHandler } from '../helpers/extensionSession';

/**
 * `useAuth` over a shared vault, with real WebCrypto, vault and storage refs.
 * A window is a fresh module instance over the shared localStorage, IndexedDB and session
 * stub; a `storage` event stands in for the notification another window's commit sends.
 */
const VALID_MNEMONIC = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
const SECURE_LOGIN_TIMEOUT = '900000';
const WAIT_FOR_CRYPTO = { timeout: 10000 };

function makeSessionStorageStub() {
  const store: Record<string, unknown> = {};
  return {
    store,
    get: vi.fn((key: string) => Promise.resolve({ [key]: store[key] })),
    set: vi.fn((obj: Record<string, unknown>) => {
      Object.assign(store, obj);
      return Promise.resolve();
    }),
    remove: vi.fn((key: string) => {
      delete store[key];
      return Promise.resolve();
    }),
  };
}

/** As in `auth.state.spec.ts`: `initPolyfills` replaced the fuller `browser` stub. */
function installExtensionStubs() {
  globalThis.browser.runtime.connect = vi.fn(() => ({
    onMessage: { addListener: vi.fn() },
    onDisconnect: { addListener: vi.fn() },
    postMessage: vi.fn(),
    disconnect: vi.fn(),
  }));
  globalThis.browser.storage.session = makeSessionStorageStub();
  installSessionMutationHandler();
  return globalThis.browser.storage.session;
}

describe('useAuth with a vault shared across windows', () => {
  let openSetPasswordModalMock;
  let openPasswordLoginModalMock;
  let openConfirmModalMock;
  let openModalMock;

  function mockConstants(overrides = {}) {
    vi.doMock('@/constants', async () => ({
      ...(await vi.importActual('@/constants')),
      IS_MOBILE_APP: false,
      IS_EXTENSION: false,
      IS_IOS: false,
      IS_OFFSCREEN_TAB: false,
      RUNNING_IN_TESTS: false,
      ...overrides,
    }));
  }

  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
    vi.doUnmock('@/lib/WalletVault');
    openSetPasswordModalMock = vi.fn().mockResolvedValue({
      password: 'old-password',
      isDefaultPasswordSecret: false,
    });
    openPasswordLoginModalMock = vi.fn().mockResolvedValue(undefined);
    openConfirmModalMock = vi.fn(() => new Promise(() => {}));
    openModalMock = vi.fn();
    vi.doMock('@aparajita/capacitor-biometric-auth', () => ({
      BiometricAuth: {
        checkBiometry: vi.fn().mockResolvedValue({ isAvailable: false }),
        authenticate: vi.fn().mockResolvedValue(undefined),
      },
    }));
    mockConstants();
    vi.doMock('@/composables/modals', () => {
      // This test's mocks, so a window left by an earlier test can't call them.
      const modals = {
        openSetPasswordModal: openSetPasswordModalMock,
        openBiometricLoginModal: vi.fn(),
        openPasswordLoginModal: openPasswordLoginModalMock,
        openEnableBiometricLoginModal: vi.fn(),
        openConfirmModal: openConfirmModalMock,
        openModal: openModalMock,
      };
      return { useModals: () => modals };
    });
    vi.doMock('@/lib/logger', () => ({ __esModule: true, default: { write: vi.fn() } }));
    vi.doMock('@/offscreen/popupHandler', () => ({
      getSessionEncryptionKey: vi.fn().mockResolvedValue(null),
    }));
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /** A popup, side panel or tab: its own module instances over the shared storage. */
  async function openWindow() {
    vi.resetModules();
    const { useAuth } = await import('@/composables/auth');
    const vault = await import('@/lib/WalletVault');
    const crypto = await import('@/utils/crypto');
    const { STORAGE_KEYS } = await import('@/constants');
    const auth = useAuth();
    await vi.waitFor(() => expect(auth.isMnemonicRestored.value).toBe(true));
    return {
      auth, vault, crypto, STORAGE_KEYS,
    };
  }

  async function createWallet(page) {
    const { auth, vault, STORAGE_KEYS } = page;
    await auth.setMnemonicAndInitializeAuthentication(VALID_MNEMONIC);
    auth.secureLoginTimeoutDecrypted.value = SECURE_LOGIN_TIMEOUT;
    await vi.waitFor(() => expect(
      vault.readVault().values[STORAGE_KEYS.secureLoginTimeout],
    ).toBeTruthy());
  }

  /** Delivers another window's commit, as its storage notification does. */
  function notifyCommit(page) {
    window.dispatchEvent(new StorageEvent('storage', { key: page.vault.VAULT_STORAGE_KEY }));
  }

  async function opensWith(page, password: string) {
    const { vault, crypto, STORAGE_KEYS } = page;
    await vault.refreshVault();
    const { values } = vault.readVault();
    const key = await crypto.generateEncryptionKey(
      password,
      crypto.decodeBase64(values[STORAGE_KEYS.encryptionSalt]),
    );
    return crypto.decrypt(key, values[STORAGE_KEYS.mnemonic]).then(
      (mnemonic) => mnemonic === VALID_MNEMONIC,
      () => false,
    );
  }

  describe('a wallet reset in another window (web)', () => {
    it('locks this window, with no wallet left to ask the password for', async () => {
      const first = await openWindow();
      await createWallet(first);
      const second = await openWindow();
      expect(await second.auth.authenticateWithPassword('old-password')).toBe(true);

      await first.vault.clearVault();
      notifyCommit(second);

      await vi.waitFor(() => expect(second.auth.isAuthenticated.value).toBe(false));
      expect(second.auth.encryptionKey.value).toBeUndefined();
      expect(second.auth.mnemonicDecrypted.value).toBe('');
      // A password check follows the lock: run one to the end before asserting it asks nothing.
      await second.auth.checkUserAuth();
      expect(openPasswordLoginModalMock).not.toHaveBeenCalled();
    });
  });

  describe('a password changed in another extension window', () => {
    it('restores the key that window published, keeping the shared session', async () => {
      mockConstants({ IS_EXTENSION: true });
      const session = installExtensionStubs();
      const first = await openWindow();
      await createWallet(first);
      const second = await openWindow();
      await vi.waitFor(() => expect(second.auth.isAuthenticated.value).toBe(true), WAIT_FOR_CRYPTO);
      const observed = [];
      const stopWatching = watch(first.auth.secureLoginTimeoutDecrypted, (value) => {
        observed.push({ value, isAuthenticated: first.auth.isAuthenticated.value });
      }, { flush: 'sync' });
      const firstKey = first.auth.encryptionKey.value;

      await second.auth.updatePassword('old-password', 'new-password');
      notifyCommit(first);

      await vi.waitFor(() => {
        expect(first.auth.isAuthenticated.value).toBe(true);
        expect(first.auth.encryptionKey.value).not.toBe(firstKey);
      }, WAIT_FOR_CRYPTO);
      expect(session.remove).not.toHaveBeenCalled();
      expect(first.auth.mnemonicDecrypted.value).toBe(VALID_MNEMONIC);
      await vi.waitFor(() => (
        expect(first.auth.secureLoginTimeoutDecrypted.value).toBe(SECURE_LOGIN_TIMEOUT)
      ));
      stopWatching();
      // Never the default timeout, or no imports, while it still counted as unlocked.
      expect(observed.filter(({ value }) => value !== SECURE_LOGIN_TIMEOUT)
        .every(({ isAuthenticated }) => !isAuthenticated)).toBe(true);
      expect(openPasswordLoginModalMock).not.toHaveBeenCalled();
      expect(await opensWith(first, 'new-password')).toBe(true);
    });

    it('follows whether that window turned the password protection off or on', async () => {
      mockConstants({ IS_EXTENSION: true });
      installExtensionStubs();
      const first = await openWindow();
      await createWallet(first);
      const second = await openWindow();
      await vi.waitFor(() => expect(second.auth.isAuthenticated.value).toBe(true), WAIT_FOR_CRYPTO);
      const { generateDefaultPasswordSecret } = await import('@/composables/defaultPassword');
      const changeIn = async (page, password, isDefaultPasswordSecret) => {
        const key = first.auth.encryptionKey.value;
        await page.auth.setPassword(password, undefined, { isDefaultPasswordSecret });
        notifyCommit(first);
        await vi.waitFor(() => {
          expect(first.auth.isAuthenticated.value).toBe(true);
          expect(first.auth.encryptionKey.value).not.toBe(key);
        }, WAIT_FOR_CRYPTO);
      };
      expect(first.auth.isUsingDefaultPassword.value).toBe(false);

      // As the password-protection toggle does.
      await changeIn(second, generateDefaultPasswordSecret(), true);
      // Its seed and keys are then shown without asking for a password nobody knows.
      expect(first.auth.isUsingDefaultPassword.value).toBe(true);

      await changeIn(second, 'new-password', false);
      expect(first.auth.isUsingDefaultPassword.value).toBe(false);
      expect(openPasswordLoginModalMock).not.toHaveBeenCalled();
    });

    /** `second` changes the password; how its key reaches the session is up to `storeKey`. */
    async function changePasswordInSecondWindow(storeKey) {
      mockConstants({ IS_EXTENSION: true });
      const session = installExtensionStubs();
      const first = await openWindow();
      await createWallet(first);
      const second = await openWindow();
      await vi.waitFor(() => expect(second.auth.isAuthenticated.value).toBe(true), WAIT_FOR_CRYPTO);
      const firstKey = first.auth.encryptionKey.value;
      const store = session.set.getMockImplementation();
      session.set.mockImplementationOnce((value) => storeKey(() => store(value)));

      await second.auth.updatePassword('old-password', 'new-password');
      notifyCommit(first);
      return { first, firstKey };
    }

    it('waits for the key when that window stores it late', async () => {
      const { first, firstKey } = await changePasswordInSecondWindow((store) => (
        new Promise((resolve) => { setTimeout(() => resolve(store()), 600); })
      ));

      await vi.waitFor(() => {
        expect(first.auth.isAuthenticated.value).toBe(true);
        expect(first.auth.encryptionKey.value).not.toBe(firstKey);
      }, WAIT_FOR_CRYPTO);
      expect(first.auth.mnemonicDecrypted.value).toBe(VALID_MNEMONIC);
      expect(openPasswordLoginModalMock).not.toHaveBeenCalled();
    });

    it('asks for the password once the key never reaches the session', async () => {
      // E.g. that window closed right after its commit.
      const { first } = await changePasswordInSecondWindow(() => Promise.resolve());

      await vi.waitFor(
        () => expect(openPasswordLoginModalMock).toHaveBeenCalled(),
        WAIT_FOR_CRYPTO,
      );
      expect(first.auth.isAuthenticated.value).toBe(false);
      expect(first.auth.encryptionKey.value).toBeUndefined();
      expect(await opensWith(first, 'new-password')).toBe(true);
    });
  });

  describe('restoring the session key at startup (extension)', () => {
    beforeEach(() => {
      mockConstants({ IS_EXTENSION: true });
    });

    it('lets a lock in this window win over a restore that was still checking the key', async () => {
      const session = installExtensionStubs();
      const first = await openWindow();
      await createWallet(first);
      let releaseRead;
      session.get.mockImplementationOnce((key) => {
        // Read before the lock: only the restore's own checks can stop the key.
        const value = session.store[key];
        return new Promise((resolve) => {
          releaseRead = () => resolve({ [key]: value });
        });
      });

      const second = await openWindow();
      await vi.waitFor(() => expect(releaseRead).toBeDefined(), WAIT_FOR_CRYPTO);
      await second.auth.logout();
      const storedAfterLock = session.set.mock.calls.length;
      releaseRead();

      await vi.waitFor(
        () => expect(openPasswordLoginModalMock).toHaveBeenCalled(),
        WAIT_FOR_CRYPTO,
      );
      expect(second.auth.isAuthenticated.value).toBe(false);
      expect(second.auth.encryptionKey.value).toBeUndefined();
      expect(session.set).toHaveBeenCalledTimes(storedAfterLock);
      expect(session.store.exportedEncryptionKey).toBeUndefined();
    });

    it('ends on the new key when a password change lands while it restores the old one', async () => {
      const session = installExtensionStubs();
      const first = await openWindow();
      await createWallet(first);
      let releaseRead;
      session.get.mockImplementationOnce((key) => {
        const value = session.store[key]; // The key of the password about to be changed
        return new Promise((resolve) => {
          releaseRead = () => resolve({ [key]: value });
        });
      });

      const second = await openWindow();
      await vi.waitFor(() => expect(releaseRead).toBeDefined(), WAIT_FOR_CRYPTO);
      await first.auth.updatePassword('old-password', 'new-password');
      releaseRead();

      await vi.waitFor(() => expect(second.auth.isAuthenticated.value).toBe(true), WAIT_FOR_CRYPTO);
      const { values } = second.vault.readVault();
      expect(await second.crypto.decrypt(
        second.auth.encryptionKey.value,
        values[second.STORAGE_KEYS.mnemonic],
      )).toBe(VALID_MNEMONIC);
      expect(openPasswordLoginModalMock).not.toHaveBeenCalled();
    });

    it('unlocks with the new key when it read the vault just before a password change', async () => {
      const session = installExtensionStubs();
      const first = await openWindow();
      await createWallet(first);
      const oldKey = session.store.exportedEncryptionKey;
      let releaseRead;
      session.get.mockImplementationOnce((key) => new Promise((resolve) => {
        // The session as it is once released: already the new password's key.
        releaseRead = () => resolve({ [key]: session.store[key] });
      }));

      const second = await openWindow();
      await vi.waitFor(() => expect(releaseRead).toBeDefined(), WAIT_FOR_CRYPTO);
      await first.auth.updatePassword('old-password', 'new-password');
      await vi.waitFor(() => expect(session.store.exportedEncryptionKey).not.toEqual(oldKey));
      const newKey = session.store.exportedEncryptionKey;
      releaseRead();

      await vi.waitFor(() => expect(second.auth.isAuthenticated.value).toBe(true), WAIT_FOR_CRYPTO);
      expect(openPasswordLoginModalMock).not.toHaveBeenCalled();
      expect(session.remove).not.toHaveBeenCalled();
      expect(session.store.exportedEncryptionKey).toEqual(newKey);
    });

    it('stays locked when another window locks while it checks the session key', async () => {
      const session = installExtensionStubs();
      const first = await openWindow();
      await createWallet(first);
      const readSession = session.get.getMockImplementation();
      let reads = 0;
      let releaseRecheck;
      session.get.mockImplementation((key) => {
        reads += 1;
        if (reads !== 2) return readSession(key);
        // The check before publishing: the session as it is once released.
        return new Promise((resolve) => {
          releaseRecheck = () => resolve({ [key]: session.store[key] });
        });
      });

      const second = await openWindow();
      await vi.waitFor(() => expect(releaseRecheck).toBeDefined(), WAIT_FOR_CRYPTO);
      await first.auth.logout();
      await vi.waitFor(() => expect(session.store.exportedEncryptionKey).toBeUndefined());
      const stored = session.set.mock.calls.length;
      releaseRecheck();

      await vi.waitFor(
        () => expect(openPasswordLoginModalMock).toHaveBeenCalled(),
        WAIT_FOR_CRYPTO,
      );
      expect(second.auth.isAuthenticated.value).toBe(false);
      expect(second.auth.encryptionKey.value).toBeUndefined();
      expect(session.set).toHaveBeenCalledTimes(stored);
    });

    it('drops a stale key, but not the newer one another window stored meanwhile', async () => {
      const session = installExtensionStubs();
      const first = await openWindow();
      await createWallet(first);
      // The new key never reaches the session: the window closed right after the commit.
      session.set.mockImplementationOnce(() => Promise.resolve());
      await first.auth.updatePassword('old-password', 'new-password');
      const { exportEncryptionKey } = first.crypto;
      const newestKey = await exportEncryptionKey(first.auth.encryptionKey.value);
      let reads = 0;
      session.get.mockImplementation(async (key) => {
        reads += 1;
        // Another window stores the current key right after the stale one was read.
        if (reads === 2) session.store[key] = newestKey;
        return { [key]: session.store[key] };
      });

      const second = await openWindow();

      await vi.waitFor(
        () => expect(openPasswordLoginModalMock).toHaveBeenCalled(),
        WAIT_FOR_CRYPTO,
      );
      expect(second.auth.isAuthenticated.value).toBe(false);
      expect(session.remove).not.toHaveBeenCalled();
      expect(session.store.exportedEncryptionKey).toBe(newestKey);
    });
  });

  describe('two windows changing the password at once (web)', () => {
    it('lets one win, and locks the other until it is unlocked with that password', async () => {
      const first = await openWindow();
      await createWallet(first);
      const second = await openWindow();
      expect(await second.auth.authenticateWithPassword('old-password')).toBe(true);

      const results = await Promise.allSettled([
        first.auth.updatePassword('old-password', 'first-password'),
        second.auth.updatePassword('old-password', 'second-password'),
      ]);

      expect(results.filter(({ status }) => status === 'fulfilled')).toHaveLength(1);
      const [winner, loser] = results[0].status === 'fulfilled'
        ? [{ page: first, password: 'first-password' }, second]
        : [{ page: second, password: 'second-password' }, first];
      expect(await opensWith(winner.page, winner.password)).toBe(true);
      expect(winner.page.auth.isAuthenticated.value).toBe(true);
      expect(loser.auth.encryptionKey.value).toBeUndefined();
      expect(loser.auth.isAuthenticated.value).toBe(false);
      await vi.waitFor(() => expect(openPasswordLoginModalMock).toHaveBeenCalled());
      expect(await loser.auth.authenticateWithPassword(winner.password)).toBe(true);
      await vi.waitFor(() => (
        expect(loser.auth.secureLoginTimeoutDecrypted.value).toBe(SECURE_LOGIN_TIMEOUT)
      ));
    });
  });

  describe('removing data the key cannot read (web)', () => {
    /** Invites stored under another key refuse the password change, naming the data. */
    async function refusedPasswordChange() {
      const page = await openWindow();
      await createWallet(page);
      const { vault, crypto, STORAGE_KEYS } = page;
      const otherKey = await crypto.generateEncryptionKey('other', crypto.generateSalt());
      await vault.writeVaultField(
        STORAGE_KEYS.invitesEncrypted,
        await crypto.encrypt(otherKey, '[]'),
      );
      const error = await page.auth.updatePassword('old-password', 'new-password')
        .catch((e) => e);
      expect(error).toBeInstanceOf(vault.VaultSecretUnreadableError);
      return { page, error };
    }

    it('removes it from the vault the error was raised for', async () => {
      const { page, error } = await refusedPasswordChange();
      const { vault, STORAGE_KEYS } = page;

      await page.auth.removeUnreadableSecret(error.storageKey, error.vault);

      expect(vault.readVault().values[STORAGE_KEYS.invitesEncrypted]).toBeNull();
      await page.auth.updatePassword('old-password', 'new-password');
      expect(await opensWith(page, 'new-password')).toBe(true);
    });

    it('removes nothing once another window stored a new password, even unnoticed', async () => {
      const { page, error } = await refusedPasswordChange();
      const other = await openWindow();
      const { vault, crypto, STORAGE_KEYS } = other;
      const salt = crypto.generateSalt();
      const newKey = await crypto.generateEncryptionKey('new-password', salt);
      const previous = vault.readVault();
      // Readable with the new password, which the first window hasn't heard of yet.
      const rotated = await vault.commitVault(previous, {
        ...previous.values,
        [STORAGE_KEYS.encryptionSalt]: crypto.encodeBase64(salt),
        [STORAGE_KEYS.mnemonic]: await crypto.encrypt(newKey, VALID_MNEMONIC),
        [STORAGE_KEYS.invitesEncrypted]: await crypto.encrypt(newKey, '[]'),
      });

      await expect(page.auth.removeUnreadableSecret(error.storageKey, error.vault))
        .rejects.toThrow(page.vault.VaultConflictError);

      await vault.refreshVault();
      expect(vault.readVault()).toEqual(rotated);
    });

    it('removes nothing after the wallet locked', async () => {
      const { page, error } = await refusedPasswordChange();
      const before = page.vault.readVault();
      await page.auth.logout();

      await expect(page.auth.removeUnreadableSecret(error.storageKey, error.vault))
        .rejects.toThrow('locked');
      expect(page.vault.readVault()).toEqual(before);
    });

    it('keeps data the key can read', async () => {
      const page = await openWindow();
      await createWallet(page);
      const { vault, crypto, STORAGE_KEYS } = page;
      await vault.writeVaultField(
        STORAGE_KEYS.invitesEncrypted,
        await crypto.encrypt(page.auth.encryptionKey.value, '[]'),
      );
      const before = vault.readVault();

      await page.auth.removeUnreadableSecret(STORAGE_KEYS.invitesEncrypted, before);

      expect(vault.readVault()).toEqual(before);
    });
  });

  describe('copies an older wallet version stored (web)', () => {
    it('refuses a new password until they are removed, as it would not protect them', async () => {
      const page = await openWindow();
      await createWallet(page);
      const { vault, STORAGE_KEYS } = page;
      const { LOCAL_STORAGE_PREFIX } = await import('@/constants');
      const legacyImports = `${LOCAL_STORAGE_PREFIX}_${STORAGE_KEYS.privateKeyAccountsRaw}`;
      // An older version, still open in another tab, stores an import of its own.
      localStorage.setItem(legacyImports, JSON.stringify('import-of-an-older-version'));
      const before = vault.readVault();

      const error = await page.auth.updatePassword('old-password', 'new-password')
        .catch((e) => e);

      expect(error).toBeInstanceOf(vault.VaultLegacyConflictError);
      await vault.refreshVault();
      expect(vault.readVault()).toEqual(before);
      expect(page.auth.isAuthenticated.value).toBe(true);

      await vault.discardLegacyCopies(error.expected);
      await page.auth.updatePassword('old-password', 'new-password');
      expect(await opensWith(page, 'new-password')).toBe(true);
      expect(localStorage.getItem(legacyImports)).toBeNull();
    });
  });

  describe('setting the first password (web)', () => {
    it('does not write over a wallet another window created while the dialog was open', async () => {
      const page = await openWindow();
      const { vault, crypto, STORAGE_KEYS } = page;
      let otherWallet;
      openSetPasswordModalMock.mockImplementation(async () => {
        const snapshot = vault.readVault();
        otherWallet = await vault.commitVault(snapshot, {
          ...snapshot.values,
          [STORAGE_KEYS.encryptionSalt]: crypto.encodeBase64(crypto.generateSalt()),
          [STORAGE_KEYS.mnemonic]: 'other-window-wallet',
        });
        return { password: 'password', isDefaultPasswordSecret: false };
      });

      await expect(page.auth.setMnemonicAndInitializeAuthentication(VALID_MNEMONIC))
        .rejects.toThrow(vault.VaultConflictError);

      await vault.refreshVault();
      expect(vault.readVault()).toEqual(otherWallet);
      expect(page.auth.isAuthenticated.value).toBe(false);
    });

    it('offers a reload rather than create a wallet over one another window stored', async () => {
      const page = await openWindow();
      const { vault, crypto, STORAGE_KEYS } = page;
      const { StoredWalletFoundError } = await import('@/lib/errors');
      const snapshot = vault.readVault();
      const otherWallet = await vault.commitVault(snapshot, {
        ...snapshot.values,
        [STORAGE_KEYS.encryptionSalt]: crypto.encodeBase64(crypto.generateSalt()),
        [STORAGE_KEYS.mnemonic]: 'other-window-wallet',
      });

      await expect(page.auth.setMnemonicAndInitializeAuthentication(VALID_MNEMONIC))
        .rejects.toThrow(StoredWalletFoundError);

      expect(openSetPasswordModalMock).not.toHaveBeenCalled();
      expect(openConfirmModalMock).toHaveBeenCalledWith(expect.objectContaining({
        msg: en.auth.walletCreatedElsewhereMessage,
      }));
      await vault.refreshVault();
      expect(vault.readVault()).toEqual(otherWallet);
      expect(page.auth.isAuthenticated.value).toBe(false);
    });

    it('does not create a wallet once another window reset the empty vault meanwhile', async () => {
      const page = await openWindow();
      const { vault } = page;
      let resetVault;
      openSetPasswordModalMock.mockImplementation(async () => {
        await vault.clearVault();
        resetVault = vault.readVault();
        return { password: 'password', isDefaultPasswordSecret: false };
      });

      await expect(page.auth.setMnemonicAndInitializeAuthentication(VALID_MNEMONIC))
        .rejects.toThrow(vault.VaultConflictError);

      await vault.refreshVault();
      expect(vault.readVault()).toEqual(resetVault);
      expect(page.auth.isAuthenticated.value).toBe(false);
    });

    it('stores a skipped password with its salt, whatever secret was stored before', async () => {
      const page = await openWindow();
      const { vault, STORAGE_KEYS } = page;
      // E.g. left by an attempt that was cut off.
      await vault.writeVaultField(STORAGE_KEYS.defaultPasswordSecret, 'another-secret');
      openSetPasswordModalMock.mockResolvedValue({
        password: 'generated-secret',
        isDefaultPasswordSecret: true,
      });

      await page.auth.setMnemonicAndInitializeAuthentication(VALID_MNEMONIC);

      expect(vault.readVault().values[STORAGE_KEYS.defaultPasswordSecret]).toBe('generated-secret');
      expect(page.auth.isUsingDefaultPassword.value).toBe(true);
      const reopened = await openWindow();
      await reopened.auth.checkUserAuth();
      expect(reopened.auth.isAuthenticated.value).toBe(true);
      expect(reopened.auth.isUsingDefaultPassword.value).toBe(true);
      expect(openPasswordLoginModalMock).not.toHaveBeenCalled();
    });

    it('removes the skipped-password secret once a real password replaces it', async () => {
      openSetPasswordModalMock.mockResolvedValue({
        password: 'generated-secret',
        isDefaultPasswordSecret: true,
      });
      const page = await openWindow();
      const { vault, STORAGE_KEYS } = page;
      await page.auth.setMnemonicAndInitializeAuthentication(VALID_MNEMONIC);

      await page.auth.setPassword('a-real-password');

      expect(vault.readVault().values[STORAGE_KEYS.defaultPasswordSecret]).toBeNull();
      const reopened = await openWindow();
      await reopened.auth.checkUserAuth();
      expect(reopened.auth.isAuthenticated.value).toBe(false);
      expect(openPasswordLoginModalMock).toHaveBeenCalled();
      expect(await opensWith(reopened, 'a-real-password')).toBe(true);
    });
  });
});
