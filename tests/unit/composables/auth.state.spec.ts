// @ts-nocheck
import { nextTick, watch } from 'vue';
import { IDBDatabase } from 'fake-indexeddb';
import en from '@/popup/locales/en-US.json';
import { installSessionMutationHandler } from '../helpers/extensionSession';

/**
 * Targeted branch coverage for `useAuth`'s state machine, extending
 * `auth.mobile.spec.ts` / `auth.offscreenSessionSync.spec.ts` rather than duplicating
 * their scenarios. Same mocking style: REAL WebCrypto (`@/utils/crypto`, unmocked
 * except in one test that narrowly wraps `encrypt`), REAL `useStorageRef`/localStorage
 * (with failures injected at the atomic vault write), REAL
 * `@/composables/defaultPassword`. Only mocked:
 *   - `@aparajita/capacitor-biometric-auth` - native hardware, unavailable in jsdom.
 *   - `@/composables/modals` - modal *components* aren't mounted here.
 *   - `@/lib/logger` - side-effecting telemetry.
 *   - `@/constants` - to force `IS_MOBILE_APP`/`IS_EXTENSION`/etc per test, since
 *     jsdom has no real platform to detect; every other constant stays real.
 *   - `@/utils/crypto` (one test only) - to make the second call to `encrypt` throw,
 *     simulating a crypto-derivation failure mid-`setPassword`.
 *
 * `useAuth` is a per-module singleton (`createCustomScopedComposable`), so an app
 * restart is simulated with `vi.resetModules()` + a fresh dynamic import - state
 * carries over via the real, un-cleared `localStorage`, exactly like a real relaunch.
 * `vi.doMock` registrations survive `vi.resetModules()` (only the module *instance*
 * cache is cleared), so mocks set up in `beforeEach` remain active after a simulated
 * restart without needing to be re-registered.
 */
const VALID_MNEMONIC = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

function flushAsync() {
  return new Promise((resolve) => { setTimeout(resolve, 0); });
}

// WebCrypto shares a small thread pool with every spec of a full run
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

/**
 * Extend (not replace) the global `browser` stub. `@/utils/session.ts` imports
 * `@/offscreen/popupHandler`, whose first line imports `@/lib/initPolyfills` - which,
 * outside an extension build, UNCONDITIONALLY overwrote `window.browser` with a reduced
 * stub (no `runtime.connect`, no `storage.session`) the very first time this file's
 * module graph loaded (via `registerAdapters`, before `beforeEach`'s mocks could apply).
 * Mocking `@/offscreen/popupHandler` from then on prevents further stomping, but doesn't
 * undo that first hit - so `runtime.connect` and `storage.session` are added back here.
 */
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

describe('useAuth state machine branches', () => {
  let openSetPasswordModalMock;
  let openBiometricLoginModalMock;
  let openPasswordLoginModalMock;
  let openEnableBiometricLoginModalMock;
  let openConfirmModalMock;
  let loggerWriteMock;

  function mockConstants(overrides = {}) {
    vi.doMock('@/constants', async () => {
      const actual = await vi.importActual('@/constants');
      return {
        ...actual,
        IS_MOBILE_APP: false,
        IS_EXTENSION: false,
        IS_IOS: false,
        IS_OFFSCREEN_TAB: false,
        RUNNING_IN_TESTS: false,
        ...overrides,
      };
    });
  }

  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
    // `vi.doMock` registrations outlive `vi.resetModules()` by design (that's what
    // lets a simulated "restart" keep the SAME mocks active) - but that means a
    // per-test override registered inside one `it()` (like the `@/utils/crypto`
    // wrap below) would otherwise leak into every later test in this file. Start
    // each test from a clean slate; only the test(s) that need it re-register it.
    // (`vi.doUnmock`, not `vi.unmock` - the latter is hoisted to the top of the
    // file and would run once, before any test, instead of per-test.)
    vi.doUnmock('@/utils/crypto');
    vi.doUnmock('@/lib/WalletVault');
    vi.doUnmock('@/composables/defaultPassword');

    openSetPasswordModalMock = vi.fn().mockResolvedValue('unused-modal-password');
    openBiometricLoginModalMock = vi.fn().mockResolvedValue(undefined);
    openPasswordLoginModalMock = vi.fn().mockResolvedValue(undefined);
    openEnableBiometricLoginModalMock = vi.fn().mockResolvedValue(undefined);
    openConfirmModalMock = vi.fn(() => new Promise(() => {}));
    loggerWriteMock = vi.fn();

    // All `vi.doMock` calls must be registered here, before any dynamic import -
    // vitest's global `registerAdapters` setup file transitively loads the real
    // `@/composables` barrel before this file's tests run; mocking afterwards is
    // too late for that first module generation.
    vi.doMock('@aparajita/capacitor-biometric-auth', () => ({
      BiometricAuth: {
        checkBiometry: vi.fn().mockResolvedValue({ isAvailable: false }),
        authenticate: vi.fn().mockResolvedValue(undefined),
      },
    }));
    mockConstants();
    vi.doMock('@/composables/modals', () => ({
      useModals: () => ({
        openSetPasswordModal: (...args) => openSetPasswordModalMock(...args),
        openBiometricLoginModal: (...args) => openBiometricLoginModalMock(...args),
        openPasswordLoginModal: (...args) => openPasswordLoginModalMock(...args),
        openEnableBiometricLoginModal: (...args) => openEnableBiometricLoginModalMock(...args),
        openConfirmModal: (...args) => openConfirmModalMock(...args),
        openModal: vi.fn(),
      }),
    }));
    vi.doMock('@/lib/logger', () => ({
      __esModule: true,
      default: { write: (...args) => loggerWriteMock(...args) },
    }));
    // `@/utils/session.ts` imports `@/offscreen/popupHandler`, whose first line
    // imports `@/lib/initPolyfills` - which, outside an extension build,
    // UNCONDITIONALLY overwrites `window.browser` with a reduced stub that has no
    // `runtime.connect` and no `storage.session`, clobbering the fuller stub
    // `config/vitest/setup.ts` installs. Mock the module out (as
    // `auth.offscreenSessionSync.spec.ts` does) so every `vi.resetModules()` +
    // re-import in this file doesn't stomp `globalThis.browser` underneath us.
    vi.doMock('@/offscreen/popupHandler', () => ({
      getSessionEncryptionKey: vi.fn().mockResolvedValue(null),
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('setPassword atomicity', () => {
    it('leaves on-disk state untouched when crypto derivation throws before any commit (front-loaded design)', async () => {
      let encryptCallCount = 0;
      // Only the SECOND call to `encrypt` (the one made by the second `setPassword`
      // below) fails - the first call, which establishes the baseline password,
      // must succeed for real.
      vi.doMock('@/utils/crypto', async (importOriginal) => {
        const actual: any = await importOriginal();
        return {
          ...actual,
          encrypt: async (...args: any[]) => {
            encryptCallCount += 1;
            if (encryptCallCount === 2) {
              throw new Error('simulated mid-flow crypto failure');
            }
            return actual.encrypt(...args);
          },
        };
      });

      const { useAuth } = await import('@/composables/auth');
      const auth = useAuth();

      await auth.setPassword('old-password', VALID_MNEMONIC);
      await nextTick();
      await flushAsync();

      const saltBeforeFailure = auth.encryptionSalt.value;
      const ciphertextBeforeFailure = auth.mnemonic.value;
      expect(auth.isMnemonicEncrypted.value).toBe(true);

      await expect(auth.setPassword('new-password', VALID_MNEMONIC))
        .rejects.toThrow('simulated mid-flow crypto failure');
      await nextTick();
      await flushAsync();

      // Neither `encryptionSalt` nor `mnemonic` were mutated - the throw happened
      // before either ref was assigned.
      expect(auth.encryptionSalt.value).toEqual(saltBeforeFailure);
      expect(auth.mnemonic.value).toBe(ciphertextBeforeFailure);

      // Simulate an app restart and confirm the OLD password still decrypts cleanly.
      vi.resetModules();
      const { useAuth: useAuthRestarted } = await import('@/composables/auth');
      const authRestarted = useAuthRestarted();
      await flushAsync();

      const ok = await authRestarted.authenticateWithPassword('old-password');
      expect(ok).toBe(true);
      expect(authRestarted.mnemonicDecrypted.value).toBe(VALID_MNEMONIC);
    });

    it('preserves the complete old vault when the atomic storage write fails', async () => {
      const { useAuth } = await import('@/composables/auth');
      const auth = useAuth();

      await auth.setPassword('old-password', VALID_MNEMONIC);
      await nextTick();
      await flushAsync();

      const { readVault, refreshVault } = await import('@/lib/WalletVault');
      const oldVaultOnDisk = readVault();
      const saltRefBeforeFailure = auth.encryptionSalt.value;
      const mnemonicRefBeforeFailure = auth.mnemonic.value;
      expect(oldVaultOnDisk).toBeTruthy();

      const put = vi.spyOn(IDBObjectStore.prototype, 'put').mockImplementation(() => {
        throw new Error('simulated storage quota exceeded on vault write');
      });

      await expect(auth.setPassword('new-password', VALID_MNEMONIC))
        .rejects.toThrow('simulated storage quota exceeded on vault write');
      await nextTick();
      await flushAsync();

      await refreshVault();
      expect(readVault()).toEqual(oldVaultOnDisk);
      // The reactive refs were never assigned either - `setPassword` threw
      // before reaching them.
      expect(auth.encryptionSalt.value).toEqual(saltRefBeforeFailure);
      expect(auth.mnemonic.value).toBe(mnemonicRefBeforeFailure);

      // Restore normal storage behavior before restarting - `useStorageRef`'s
      // restore IIFE writes back the values its migrations change.
      put.mockRestore();

      vi.resetModules();
      const { useAuth: useAuthRestarted } = await import('@/composables/auth');
      const authRestarted = useAuthRestarted();
      await flushAsync();

      // The account is NOT bricked: the old password still decrypts cleanly.
      const ok = await authRestarted.authenticateWithPassword('old-password');
      expect(ok).toBe(true);
      expect(authRestarted.mnemonicDecrypted.value).toBe(VALID_MNEMONIC);
    });
  });

  describe('password change', () => {
    // Not the default, so a timeout that can't be decrypted anymore shows up.
    const SECURE_LOGIN_TIMEOUT = '900000';

    afterEach(() => {
      vi.restoreAllMocks();
    });

    async function readStorage(name: string) {
      const { STORAGE_KEYS } = await import('@/constants');
      const { WalletStorage } = await import('@/lib/WalletStorage');
      return WalletStorage.get(STORAGE_KEYS[name]);
    }

    async function createWallet() {
      openSetPasswordModalMock.mockResolvedValue('old-password');
      const { useAuth } = await import('@/composables/auth');
      const auth = useAuth();
      await auth.setMnemonicAndInitializeAuthentication(VALID_MNEMONIC);
      // Encrypted with the password key, like the imported private keys.
      auth.secureLoginTimeoutDecrypted.value = SECURE_LOGIN_TIMEOUT;
      await vi.waitFor(async () => expect(await readStorage('secureLoginTimeout')).toBeTruthy());
      return auth;
    }

    async function expectReadableAfterRestart(password: string) {
      vi.resetModules();
      const { useAuth } = await import('@/composables/auth');
      const auth = useAuth();
      await flushAsync();

      expect(await auth.authenticateWithPassword(password)).toBe(true);
      expect(auth.mnemonicDecrypted.value).toBe(VALID_MNEMONIC);
      await vi.waitFor(() => (
        expect(auth.secureLoginTimeoutDecrypted.value).toBe(SECURE_LOGIN_TIMEOUT)
      ));
    }

    it('keeps the wallet data readable with the new password', async () => {
      const auth = await createWallet();
      const timeoutCiphertext = await readStorage('secureLoginTimeout');

      await auth.updatePassword('old-password', 'new-password');
      expect(await readStorage('secureLoginTimeout')).not.toBe(timeoutCiphertext);

      await expectReadableAfterRestart('new-password');
    });

    it('keeps the decrypted data in view while its own password change settles', async () => {
      let isArmed = false;
      let isAfterCommit = false;
      let releaseRefresh;
      vi.doMock('@/lib/WalletVault', async (importOriginal) => {
        const actual = await importOriginal();
        return {
          ...actual,
          commitVault: async (...args) => {
            const result = await actual.commitVault(...args);
            isAfterCommit = isArmed;
            return result;
          },
          refreshVault: async (...args) => {
            // The read before the new key is published: the commit already reached the views.
            if (isAfterCommit) {
              isAfterCommit = false;
              await new Promise((resolve) => { releaseRefresh = resolve; });
            }
            return actual.refreshVault(...args);
          },
        };
      });
      const auth = await createWallet();
      await vi.waitFor(() => (
        expect(auth.secureLoginTimeoutDecrypted.value).toBe(SECURE_LOGIN_TIMEOUT)
      ));
      const warn = vi.spyOn(console, 'warn');
      const observed = [];
      const stopWatching = watch(auth.secureLoginTimeoutDecrypted, (value) => {
        observed.push(value);
      }, { flush: 'sync' });

      isArmed = true;
      const change = auth.updatePassword('old-password', 'new-password');
      await vi.waitFor(() => expect(releaseRefresh).toBeDefined(), WAIT_FOR_CRYPTO);
      // Time for a decrypt with the old key to fail.
      await new Promise((resolve) => { setTimeout(resolve, 50); });
      releaseRefresh();
      await change;
      await flushAsync();
      stopWatching();

      expect(observed.every((value) => value === SECURE_LOGIN_TIMEOUT)).toBe(true);
      expect(auth.secureLoginTimeoutDecrypted.value).toBe(SECURE_LOGIN_TIMEOUT);
      expect(warn).not.toHaveBeenCalledWith('Unknown rejection', expect.anything());
    });

    it('waits for imported-key encryption and commits unmounted secrets before reporting success', async () => {
      const auth = await createWallet();
      const { STORAGE_KEYS } = await import('@/constants');
      const {
        commitVault, readVault, refreshVault, VAULT_SECRET_KEYS,
      } = await import('@/lib/WalletVault');
      const {
        decodeBase64, decrypt, encrypt, generateEncryptionKey,
      } = await import('@/utils/crypto');
      const imported = JSON.stringify([{ protocol: 'ethereum', privateKey: 'ab'.repeat(32) }]);
      const plaintexts = {
        [STORAGE_KEYS.mnemonic]: VALID_MNEMONIC,
        [STORAGE_KEYS.privateKeyAccountsRaw]: imported,
        [STORAGE_KEYS.preclaimedNames]: JSON.stringify({ ae_mainnet: { 'pending.chain': { salt: 123 } } }),
        [STORAGE_KEYS.secureLoginTimeout]: SECURE_LOGIN_TIMEOUT,
        [STORAGE_KEYS.invitesEncrypted]: JSON.stringify([{ secretKey: { type: 'Buffer', data: [1, 2, 3] } }]),
      };
      const oldKey = auth.encryptionKey.value;
      const beforeSetup = readVault();
      const values = { ...beforeSetup.values };
      await Promise.all(Object.entries(plaintexts).map(async ([key, plaintext]) => {
        values[key] = await encrypt(oldKey, plaintext);
      }));
      // Neither useAccounts nor useAeNames is initialized in this wallet instance.
      await commitVault(beforeSetup, values);
      const oldStoredVault = readVault();
      let releaseEncryption;
      const pendingEncryption = new Promise((resolve) => { releaseEncryption = resolve; });
      let encryptionStarted = false;
      const subtleEncrypt = globalThis.crypto.subtle.encrypt.bind(globalThis.crypto.subtle);
      vi.spyOn(globalThis.crypto.subtle, 'encrypt').mockImplementation(async (...args) => {
        if (new TextDecoder().decode(args[2]) === imported) {
          encryptionStarted = true;
          await pendingEncryption;
        }
        return subtleEncrypt(...args);
      });
      let completed = false;
      const changing = auth.updatePassword('old-password', 'new-password')
        .then(() => { completed = true; });
      try {
        await vi.waitFor(() => expect(encryptionStarted).toBe(true), WAIT_FOR_CRYPTO);
        expect(completed).toBe(false);
        expect(auth.encryptionKey.value).toBe(oldKey);
        await refreshVault();
        expect(readVault()).toEqual(oldStoredVault);
      } finally {
        releaseEncryption();
        await changing;
      }

      const stored = readVault();
      const key = await generateEncryptionKey(
        'new-password',
        decodeBase64(stored.values[STORAGE_KEYS.encryptionSalt]),
      );
      await Promise.all(VAULT_SECRET_KEYS.map(async (slot) => {
        expect(await decrypt(key, stored.values[slot])).toBe(plaintexts[slot]);
        await expect(decrypt(oldKey, stored.values[slot])).rejects.toThrow();
      }));
      await expectReadableAfterRestart('new-password');
    });

    it.each(['privateKeyAccountsRaw', 'preclaimedNames', 'invitesEncrypted', 'secureLoginTimeout'])(
      'preserves the password and unreadable %s ciphertext when rotation cannot prepare it',
      async (name) => {
        const auth = await createWallet();
        const { STORAGE_KEYS } = await import('@/constants');
        const { commitVault, readVault, refreshVault } = await import('@/lib/WalletVault');
        vi.spyOn(console, 'warn').mockImplementation(() => {});
        const previous = readVault();
        await commitVault(previous, { ...previous.values, [STORAGE_KEYS[name]]: 'unreadable-ciphertext' });
        const oldVault = readVault();
        const oldKey = auth.encryptionKey.value;

        await expect(auth.updatePassword('old-password', 'new-password')).rejects.toThrow();

        await refreshVault();
        expect(readVault()).toEqual(oldVault);
        expect(auth.encryptionKey.value).toBe(oldKey);
        const { decodeBase64, decrypt, generateEncryptionKey } = await import('@/utils/crypto');
        const stored = readVault();
        const key = await generateEncryptionKey('old-password', decodeBase64(stored.values[STORAGE_KEYS.encryptionSalt]));
        expect(await decrypt(key, stored.values[STORAGE_KEYS.mnemonic])).toBe(VALID_MNEMONIC);
      },
    );

    it('locks a web window whose password another window changed, without the old key or defaults', async () => {
      const auth = await createWallet();
      const { STORAGE_KEYS } = await import('@/constants');
      const { commitVault, readVault, refreshVault } = await import('@/lib/WalletVault');
      const {
        encodeBase64, encrypt, generateEncryptionKey, generateSalt,
      } = await import('@/utils/crypto');
      await vi.waitFor(() => (
        expect(auth.secureLoginTimeoutDecrypted.value).toBe(SECURE_LOGIN_TIMEOUT)
      ));
      const salt = generateSalt();
      const key = await generateEncryptionKey('other-password', salt);
      const previous = readVault();
      // The other window's commit, as its storage notification makes this one read it.
      const observed = [];
      const stopWatching = watch(auth.secureLoginTimeoutDecrypted, (value) => {
        observed.push({ value, isAuthenticated: auth.isAuthenticated.value });
      }, { flush: 'sync' });
      const committed = await commitVault(previous, {
        ...previous.values,
        [STORAGE_KEYS.encryptionSalt]: encodeBase64(salt),
        [STORAGE_KEYS.mnemonic]: await encrypt(key, VALID_MNEMONIC),
        [STORAGE_KEYS.secureLoginTimeout]: await encrypt(key, SECURE_LOGIN_TIMEOUT),
      });

      expect(encodeBase64(auth.encryptionSalt.value)).toBe(encodeBase64(salt));
      expect(auth.encryptionKey.value).toBeUndefined();
      expect(auth.isAuthenticated.value).toBe(false);
      expect(auth.mnemonicDecrypted.value).toBe('');
      // The web has no shared session: it asks for the new password.
      await vi.waitFor(() => expect(openPasswordLoginModalMock).toHaveBeenCalled());
      await expect(auth.setPassword('another-password')).rejects.toThrow('locked');
      await refreshVault();
      expect(readVault()).toEqual(committed);

      expect(await auth.authenticateWithPassword('other-password')).toBe(true);
      await vi.waitFor(() => (
        expect(auth.secureLoginTimeoutDecrypted.value).toBe(SECURE_LOGIN_TIMEOUT)
      ));
      stopWatching();
      // Locked rather than a failed decrypt: unlocked, never the default, longer, auto-lock time.
      expect(observed.filter(({ value }) => value !== SECURE_LOGIN_TIMEOUT)
        .every(({ isAuthenticated }) => !isAuthenticated)).toBe(true);
    });

    it('does not overwrite a newer generation when its own commit promise settles later', async () => {
      let pauseCommit = false;
      let committed = false;
      let releaseCommit;
      const gate = new Promise((resolve) => { releaseCommit = resolve; });
      vi.doMock('@/lib/WalletVault', async (importOriginal) => {
        const actual = await importOriginal();
        return {
          ...actual,
          commitVault: async (...args) => {
            const result = await actual.commitVault(...args);
            if (pauseCommit) {
              committed = true;
              await gate;
            }
            return result;
          },
        };
      });
      const auth = await createWallet();
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      const vault = await vi.importActual('@/lib/WalletVault');
      const { STORAGE_KEYS } = await import('@/constants');
      const {
        encodeBase64, encrypt, generateEncryptionKey, generateSalt,
      } = await import('@/utils/crypto');
      pauseCommit = true;
      const changing = auth.updatePassword('old-password', 'new-password');
      const rejected = expect(changing).rejects.toThrow('changed again');
      let latest;
      try {
        await vi.waitFor(() => expect(committed).toBe(true), WAIT_FOR_CRYPTO);
        const first = vault.readVault();
        const salt = generateSalt();
        const key = await generateEncryptionKey('latest-password', salt);
        latest = await vault.commitVault(first, {
          ...first.values,
          [STORAGE_KEYS.encryptionSalt]: encodeBase64(salt),
          [STORAGE_KEYS.mnemonic]: await encrypt(key, VALID_MNEMONIC),
          [STORAGE_KEYS.secureLoginTimeout]: await encrypt(key, SECURE_LOGIN_TIMEOUT),
        });
      } finally {
        releaseCommit();
      }
      await rejected;
      await vault.refreshVault();
      expect(vault.readVault()).toEqual(latest);
      // Its key opens nothing any more: locked until the latest password is entered.
      await vi.waitFor(() => expect(openPasswordLoginModalMock).toHaveBeenCalled());
      expect(auth.encryptionKey.value).toBeUndefined();
      expect(auth.isAuthenticated.value).toBe(false);
      await expectReadableAfterRestart('latest-password');
    });

    it('reports rotation success when the subsequent vault refresh cannot read storage', async () => {
      let failReadAfterCommit = false;
      const failure = new Error('post-commit database read unavailable');
      vi.doMock('@/lib/WalletVault', async (importOriginal) => {
        const actual = await importOriginal();
        return {
          ...actual,
          commitVault: async (...args) => {
            const result = await actual.commitVault(...args);
            if (failReadAfterCommit) {
              vi.spyOn(IDBObjectStore.prototype, 'get').mockImplementationOnce(() => {
                throw failure;
              });
            }
            return result;
          },
        };
      });
      const auth = await createWallet();
      const oldKey = auth.encryptionKey.value;
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      failReadAfterCommit = true;

      await expect(auth.updatePassword('old-password', 'new-password')).resolves.toBeUndefined();

      expect(warn).toHaveBeenCalledWith('Unknown rejection', expect.objectContaining({ cause: failure }));
      expect(auth.encryptionKey.value).not.toBe(oldKey);
      expect(auth.isAuthenticated.value).toBe(true);
      failReadAfterCommit = false;
      await expectReadableAfterRestart('new-password');
    });

    it('does not publish an old password key after the stored generation changes during unlock', async () => {
      const auth = await createWallet();
      const { STORAGE_KEYS } = await import('@/constants');
      const { commitVault, readVault } = await import('@/lib/WalletVault');
      const {
        encodeBase64, encrypt, generateEncryptionKey, generateSalt,
      } = await import('@/utils/crypto');
      const salt = generateSalt();
      const key = await generateEncryptionKey('other-password', salt);
      const previous = readVault();
      const values = {
        ...previous.values,
        [STORAGE_KEYS.encryptionSalt]: encodeBase64(salt),
        [STORAGE_KEYS.mnemonic]: await encrypt(key, VALID_MNEMONIC),
        [STORAGE_KEYS.secureLoginTimeout]: await encrypt(key, SECURE_LOGIN_TIMEOUT),
      };
      await auth.logout();
      let releaseDerivation;
      const gate = new Promise((resolve) => { releaseDerivation = resolve; });
      let deriving = false;
      const original = globalThis.crypto.subtle.deriveKey.bind(globalThis.crypto.subtle);
      vi.spyOn(globalThis.crypto.subtle, 'deriveKey').mockImplementationOnce(async (...args) => {
        deriving = true;
        await gate;
        return original(...args);
      });
      const unlocking = auth.authenticateWithPassword('old-password');
      const rejected = expect(unlocking).rejects.toThrow('changed while unlocking');
      try {
        await vi.waitFor(() => expect(deriving).toBe(true));
        await commitVault(previous, values);
      } finally {
        releaseDerivation();
      }
      await rejected;
      expect(auth.encryptionKey.value).toBeUndefined();
      expect(auth.isAuthenticated.value).toBe(false);
    });

    it('keeps the wallet locked when locking occurs after the persistent rotation commit', async () => {
      let pauseCommit = false;
      let committed = false;
      let releaseCommit;
      const gate = new Promise((resolve) => { releaseCommit = resolve; });
      vi.doMock('@/lib/WalletVault', async (importOriginal) => {
        const actual = await importOriginal();
        return {
          ...actual,
          commitVault: async (...args) => {
            const result = await actual.commitVault(...args);
            if (pauseCommit) {
              committed = true;
              await gate;
            }
            return result;
          },
        };
      });
      const auth = await createWallet();
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      pauseCommit = true;
      const changing = auth.updatePassword('old-password', 'new-password');
      try {
        await vi.waitFor(() => expect(committed).toBe(true), WAIT_FOR_CRYPTO);
        await auth.logout();
      } finally {
        releaseCommit();
        await changing;
      }

      expect(auth.encryptionKey.value).toBeUndefined();
      expect(auth.isAuthenticated.value).toBe(false);
      await expectReadableAfterRestart('new-password');
    });

    it('keeps the wallet data readable when the wallet locks right after the change', async () => {
      const auth = await createWallet();
      const timeoutCiphertext = await readStorage('secureLoginTimeout');

      await auth.updatePassword('old-password', 'new-password');
      await auth.lockWallet();
      // Writers that captured the key before locking can still finish safely.
      expect(auth.isEncryptionKeyCurrent()).toBe(true);
      expect(await readStorage('secureLoginTimeout')).not.toBe(timeoutCiphertext);

      await expectReadableAfterRestart('new-password');
    });

    it('keeps the old password when the current password is wrong', async () => {
      const auth = await createWallet();

      await expect(auth.updatePassword('wrong-password', 'new-password')).rejects.toThrow();
      expect(auth.isAuthenticated.value).toBe(true);

      await expectReadableAfterRestart('old-password');
    });

    // Locking from inside the real key derivation lands the lock mid-change every time.
    it.each([
      ['checking the current password', 1],
      ['deriving the new key', 2],
    ])('keeps the old password when the wallet locks while %s', async (_, lockingDerivation) => {
      const auth = await createWallet();
      const { subtle } = globalThis.crypto;
      const deriveKey = subtle.deriveKey.bind(subtle);
      let derivationCount = 0;
      let locking;
      vi.spyOn(subtle, 'deriveKey').mockImplementation((...args) => {
        derivationCount += 1;
        if (derivationCount === lockingDerivation) {
          locking = auth.lockWallet();
        }
        return deriveKey(...args);
      });

      await expect(auth.updatePassword('old-password', 'new-password')).rejects.toThrow('locked');
      await locking;
      expect(auth.isAuthenticated.value).toBe(false);

      await expectReadableAfterRestart('old-password');
    });

    it('refuses to change the password while the wallet is locked', async () => {
      const auth = await createWallet();
      await auth.lockWallet();

      await expect(auth.updatePassword('old-password', 'new-password')).rejects.toThrow('locked');

      await expectReadableAfterRestart('old-password');
    });

    it('refuses to set a password while the wallet is locked', async () => {
      const auth = await createWallet();
      await auth.lockWallet();
      const mnemonicCiphertext = await readStorage('mnemonic');

      await expect(auth.setPassword('new-password')).rejects.toThrow('mnemonic');
      expect(await readStorage('mnemonic')).toBe(mnemonicCiphertext);
    });
  });

  describe('legacy default-password rotation', () => {
    const SECURE_LOGIN_TIMEOUT = '900000';
    const IMPORTED_ACCOUNTS = JSON.stringify([{
      type: 'private-key',
      isRestored: false,
      protocol: 'ethereum',
      privateKey: Buffer.from('aa'.repeat(32), 'hex'),
    }]);
    const ENCRYPTED_DATA = {
      mnemonic: VALID_MNEMONIC,
      privateKeyAccountsRaw: IMPORTED_ACCOUNTS,
      secureLoginTimeout: SECURE_LOGIN_TIMEOUT,
    };

    afterEach(() => {
      vi.restoreAllMocks();
    });

    async function readStorage(name: string) {
      const { STORAGE_KEYS } = await import('@/constants');
      const { WalletStorage } = await import('@/lib/WalletStorage');
      return WalletStorage.get(STORAGE_KEYS[name]);
    }

    async function storedKey() {
      const { generateEncryptionKey, decodeBase64 } = await import('@/utils/crypto');
      return generateEncryptionKey(
        await readStorage('defaultPasswordSecret'),
        decodeBase64(await readStorage('encryptionSalt')),
      );
    }

    /** A wallet stored by the pre-upgrade "skip password" flow, with an imported account. */
    async function seedWallet(password: string) {
      const {
        encodeBase64, encrypt, generateEncryptionKey, generateSalt,
      } = await import('@/utils/crypto');
      const { WalletStorage } = await import('@/lib/WalletStorage');
      const { STORAGE_KEYS } = await import('@/constants');
      const salt = generateSalt();
      const key = await generateEncryptionKey(password, salt);
      WalletStorage.set(STORAGE_KEYS.encryptionSalt, encodeBase64(salt));
      WalletStorage.set(STORAGE_KEYS.accountsRaw, [
        { isRestored: true, protocol: 'aeternity', type: 'hd-wallet' },
      ]);
      await Promise.all(Object.entries(ENCRYPTED_DATA).map(async ([name, plaintext]) => (
        WalletStorage.set(STORAGE_KEYS[name], await encrypt(key, plaintext))
      )));
      return key;
    }

    /** A popup or side panel: its own module instances over the shared storage. */
    async function openWindow() {
      vi.resetModules();
      await import('@/protocols/registerAdapters');
      const { useAuth } = await import('@/composables/auth');
      const { useAccounts } = await import('@/composables/accounts');
      const auth = useAuth();
      const accounts = useAccounts();
      await vi.waitFor(() => expect(auth.isMnemonicRestored.value).toBe(true));
      return { auth, accounts };
    }

    /** Every stored secret must use the new password when rotation reports success. */
    async function waitForDataUnderStoredSecret() {
      const { decrypt } = await import('@/utils/crypto');
      const key = await storedKey();
      await Promise.all(Object.entries(ENCRYPTED_DATA).map(async ([name, plaintext]) => (
        expect(await decrypt(key, await readStorage(name))).toBe(plaintext)
      )));
    }

    async function expectOpensWithStoredSecret() {
      await waitForDataUnderStoredSecret();
      const { auth, accounts } = await openWindow();
      await auth.checkUserAuth();
      expect(auth.isAuthenticated.value).toBe(true);
      expect(auth.isUsingDefaultPassword.value).toBe(true);
      expect(openPasswordLoginModalMock).not.toHaveBeenCalled();
      await vi.waitFor(() => expect(accounts.accounts.value.map(({ type }) => type))
        .toEqual(['hd-wallet', 'private-key']), WAIT_FOR_CRYPTO);
      expect(auth.secureLoginTimeoutDecrypted.value).toBe(SECURE_LOGIN_TIMEOUT);
    }

    it('moves the wallet and its data to a per-install secret', async () => {
      const { decrypt } = await import('@/utils/crypto');
      const legacyKey = await seedWallet('testPassword123');
      const legacySalt = await readStorage('encryptionSalt');
      const { auth } = await openWindow();

      await auth.checkUserAuth();
      expect(auth.isAuthenticated.value).toBe(true);
      expect(auth.isUsingDefaultPassword.value).toBe(true);

      await waitForDataUnderStoredSecret();
      expect(await readStorage('defaultPasswordSecret')).not.toBe('testPassword123');
      expect(await readStorage('encryptionSalt')).not.toBe(legacySalt);
      await Promise.all(Object.keys(ENCRYPTED_DATA).map(async (name) => (
        expect(decrypt(legacyKey, await readStorage(name))).rejects.toThrow()
      )));

      await expectOpensWithStoredSecret();
    });

    it('leaves no older copy that opens without the password set later, where the vault is not stored durably', async () => {
      // E.g. Firefox before 126, which keeps the copies of older versions as a fallback.
      const realTransaction = IDBDatabase.prototype.transaction;
      vi.spyOn(IDBDatabase.prototype, 'transaction')
        .mockImplementation(function transaction(...args) {
          const result = realTransaction.apply(this, args);
          Object.defineProperty(result, 'durability', { value: undefined });
          return result;
        });
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      const { WalletStorage } = await import('@/lib/WalletStorage');
      const { LOCAL_STORAGE_PREFIX, STORAGE_KEYS } = await import('@/constants');
      const { decodeBase64, decrypt, generateEncryptionKey } = await import('@/utils/crypto');
      const skipped = 'a-per-install-secret';
      await seedWallet(skipped);
      WalletStorage.set(STORAGE_KEYS.defaultPasswordSecret, skipped);
      const { auth } = await openWindow();
      await auth.checkUserAuth();
      expect(auth.isUsingDefaultPassword.value).toBe(true);

      // As the password-protection toggle does.
      await auth.setPassword('a-user-chosen-password', undefined, {
        isDefaultPasswordSecret: false,
      });

      const copy = (key) => JSON.parse(localStorage.getItem(`${LOCAL_STORAGE_PREFIX}_${key}`));
      expect(copy(STORAGE_KEYS.defaultPasswordSecret)).toBeNull();
      const key = await generateEncryptionKey(
        'a-user-chosen-password',
        decodeBase64(copy(STORAGE_KEYS.encryptionSalt)),
      );
      await Promise.all(Object.entries(ENCRYPTED_DATA).map(async ([name, plaintext]) => (
        expect(await decrypt(key, copy(STORAGE_KEYS[name]))).toBe(plaintext)
      )));
    });

    it.each([
      ['no secret', null],
      // E.g. one written before a rotation that was cut off.
      ['a stale secret', 'stale-secret'],
    ])('leaves the legacy wallet with %s as it was when storing the new one fails, and rotates it later', async (_, storedSecret) => {
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      await seedWallet('testPassword123');
      const legacySalt = await readStorage('encryptionSalt');
      const { STORAGE_KEYS } = await import('@/constants');
      if (storedSecret) {
        const { WalletStorage } = await import('@/lib/WalletStorage');
        WalletStorage.set(STORAGE_KEYS.defaultPasswordSecret, storedSecret);
      }
      const { ensureVaultReady } = await import('@/lib/WalletVault');
      await ensureVaultReady();
      const put = vi.spyOn(IDBObjectStore.prototype, 'put').mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });
      const { auth } = await openWindow();

      await auth.checkUserAuth();
      expect(auth.isAuthenticated.value).toBe(true);
      expect(await readStorage('defaultPasswordSecret')).toBe(storedSecret);
      expect(await readStorage('encryptionSalt')).toBe(legacySalt);

      put.mockRestore();
      const { auth: reopened } = await openWindow();
      await reopened.checkUserAuth();
      expect(reopened.isUsingDefaultPassword.value).toBe(true);
      await expectOpensWithStoredSecret();
    });

    it('asks for the password when neither the stored nor the legacy secret opens the wallet', async () => {
      await seedWallet('a-real-password');
      const { auth } = await openWindow();

      await auth.checkUserAuth();

      expect(openPasswordLoginModalMock).toHaveBeenCalledTimes(1);
      expect(auth.isAuthenticated.value).toBe(false);
      expect(await readStorage('defaultPasswordSecret')).toBeNull();
    });

    it('keeps a real password when an unlock lands during the legacy password attempt', async () => {
      let isNextRefreshHeld = false;
      let isRefreshHeld = false;
      let releaseRefresh;
      vi.doMock('@/lib/WalletVault', async (importOriginal) => {
        const actual = await importOriginal();
        return {
          ...actual,
          refreshVault: async (...args) => {
            if (isNextRefreshHeld) {
              isNextRefreshHeld = false;
              isRefreshHeld = true;
              await new Promise((resolve) => { releaseRefresh = resolve; });
            }
            return actual.refreshVault(...args);
          },
        };
      });
      // No stored secret, so the next read is the legacy attempt's.
      vi.doMock('@/composables/defaultPassword', async (importOriginal) => ({
        ...await importOriginal(),
        getDefaultPasswordSecret: async () => null,
      }));
      await seedWallet('a-real-password');
      const salt = await readStorage('encryptionSalt');
      const { auth } = await openWindow();

      isNextRefreshHeld = true;
      const check = auth.checkUserAuth();
      await vi.waitFor(() => expect(isRefreshHeld).toBe(true));
      // E.g. the session restore after another window changed the password.
      await auth.authenticateWithPassword('a-real-password');
      const key = auth.encryptionKey.value;
      releaseRefresh();
      await check;

      expect(auth.isAuthenticated.value).toBe(true);
      expect(auth.encryptionKey.value).toBe(key);
      expect(auth.isUsingDefaultPassword.value).toBe(false);
      expect(openPasswordLoginModalMock).not.toHaveBeenCalled();
      expect(await readStorage('encryptionSalt')).toBe(salt);
      expect(await readStorage('defaultPasswordSecret')).toBeNull();
    });

    it('stores one secret and salt that open the wallet when two windows rotate at once', async () => {
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      await seedWallet('testPassword123');
      const legacySalt = await readStorage('encryptionSalt');
      const { encodeBase64 } = await import('@/utils/crypto');
      const { auth: first } = await openWindow();
      const { auth: second } = await openWindow();
      // Each new key (fresh salt) waits until its turn.
      const { subtle } = globalThis.crypto;
      const deriveKey = subtle.deriveKey.bind(subtle);
      const heldDerivations = [];
      vi.spyOn(subtle, 'deriveKey').mockImplementation((params, ...rest) => (
        encodeBase64(params.salt) === legacySalt
          ? deriveKey(params, ...rest)
          : new Promise((resolve) => {
            heldDerivations.push(() => resolve(deriveKey(params, ...rest)));
          })
      ));

      const firstCheck = first.checkUserAuth();
      await vi.waitFor(() => expect(heldDerivations).toHaveLength(1), WAIT_FOR_CRYPTO);
      const secondCheck = second.checkUserAuth();
      await vi.waitFor(() => expect(heldDerivations).toHaveLength(2), WAIT_FOR_CRYPTO);
      heldDerivations[0]();
      await vi.waitFor(
        async () => expect(await readStorage('encryptionSalt')).not.toBe(legacySalt),
        WAIT_FOR_CRYPTO,
      );
      heldDerivations[1]();
      // The window that lost unlocks again with the secret the other one stored.
      vi.mocked(subtle.deriveKey).mockRestore();
      await Promise.all([firstCheck, secondCheck]);
      expect(first.isAuthenticated.value).toBe(true);
      expect(second.isAuthenticated.value).toBe(true);
      expect(openPasswordLoginModalMock).not.toHaveBeenCalled();

      const { decrypt } = await import('@/utils/crypto');
      expect(await decrypt(await storedKey(), await readStorage('mnemonic'))).toBe(VALID_MNEMONIC);
      await expectOpensWithStoredSecret();
    });
  });

  describe('failed default-password guess (extension)', () => {
    it('keeps a valid background session when the default-password guesses fail', async () => {
      mockConstants({ IS_EXTENSION: true });
      installExtensionStubs();

      const { useAuth } = await import('@/composables/auth');
      const auth = useAuth();

      // A real user password - guaranteed to differ from both the per-install
      // default-password secret (never created in this test) and the legacy
      // hardcoded sentinel, so `checkUserAuth`'s default-password fast path below
      // is guaranteed to fail on both attempts.
      await auth.setPassword('correct horse battery staple', VALID_MNEMONIC);
      await nextTick();
      await flushAsync();

      expect(globalThis.browser.storage.session.set).toHaveBeenCalled();

      // Simulate the popup closing and reopening: a fresh module instance has no
      // in-memory `encryptionKey`, but the key published into
      // `browser.storage.session` by `sessionStart()` above survives independently
      // of module state, exactly like the real background/session storage would.
      vi.resetModules();
      const { useAuth: useAuthRestarted } = await import('@/composables/auth');
      const authRestarted = useAuthRestarted();

      // `useAuth()`'s init IIFE auto-triggers `checkUserAuth()` for extensions, so
      // just wait for the flow (default-password guesses, then session recovery)
      // to settle rather than driving it manually.
      await vi.waitFor(() => {
        if (!authRestarted.isAuthenticated.value) {
          throw new Error('not authenticated yet');
        }
      });

      // The failed default-password/legacy-password guesses must never have gone
      // through `setEncryptionKey(undefined)` -> `sessionEnd()` -> this remove call.
      expect(globalThis.browser.storage.session.remove).not.toHaveBeenCalled();

      // ...and because the session key survived, the extension recovers it via
      // `getSessionEncryptionKey()` right after, authenticating anyway.
      expect(authRestarted.isAuthenticated.value).toBe(true);
      expect(authRestarted.mnemonicDecrypted.value).toBe(VALID_MNEMONIC);
      expect(authRestarted.isUsingDefaultPassword.value).toBe(false);
      expect(authRestarted.encryptionKey.value).toBeDefined();
      expect(openPasswordLoginModalMock).not.toHaveBeenCalled();
    });
  });

  describe('auto-lock on resume', () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    async function openUnlocked() {
      const { useAuth } = await import('@/composables/auth');
      const { useUi } = await import('@/composables/ui');
      const auth = useAuth();
      const ui = useUi();
      ui.isAppActive.value = true;
      await flushAsync();
      await auth.setPassword('a-real-password', VALID_MNEMONIC);
      return { auth, ui };
    }

    async function hideAndShow(ui, hiddenMs = 0) {
      const { isAppActive } = ui;
      // Frozen, so the deadline set on hiding is exactly `hiddenMs` before the return
      const dateNow = vi.spyOn(Date, 'now').mockReturnValue(Date.now());
      const now = Date.now();
      isAppActive.value = false;
      await nextTick();
      dateNow.mockReturnValue(now + hiddenMs);
      isAppActive.value = true;
      await nextTick();
    }

    it('locks the web wallet hidden for longer than the timeout', async () => {
      const { auth, ui } = await openUnlocked();

      await hideAndShow(ui, 300000);

      await vi.waitFor(() => expect(auth.isAuthenticated.value).toBe(false));
    });

    it('keeps the web wallet open when it comes back in time', async () => {
      const { auth, ui } = await openUnlocked();

      await hideAndShow(ui, 299999);
      await flushAsync();

      expect(auth.isAuthenticated.value).toBe(true);
    });

    it('locks the extension when the background dropped the session key meanwhile', async () => {
      mockConstants({ IS_EXTENSION: true });
      const session = installExtensionStubs();
      const { auth, ui } = await openUnlocked();
      await vi.waitFor(
        () => expect(session.store.exportedEncryptionKey).toBeDefined(),
        WAIT_FOR_CRYPTO,
      );

      // The session timeout ran out while no page was open.
      delete session.store.exportedEncryptionKey;
      await hideAndShow(ui);

      await vi.waitFor(() => expect(auth.isAuthenticated.value).toBe(false));
    });

    describe('on the extension, while hidden', () => {
      afterEach(() => {
        vi.useRealTimers();
      });

      /** Session ports this page connected and hasn't disconnected yet. */
      function heldPorts() {
        return globalThis.browser.runtime.connect.mock.results
          .map(({ value }) => value)
          .filter(({ disconnect }) => !disconnect.mock.calls.length);
      }

      async function openUnlockedExtensionPage(constants = {}) {
        mockConstants({ IS_EXTENSION: true, ...constants });
        const session = installExtensionStubs();
        const { auth, ui } = await openUnlocked();
        await vi.waitFor(
          () => expect(session.store.exportedEncryptionKey).toBeDefined(),
          WAIT_FOR_CRYPTO,
        );
        return { auth, ui, session };
      }

      /**
       * Returns a wait for the session key check of the next show, which may lock the page.
       * It resolves to the count of session ports held when the check started.
       */
      function watchKeyCheck() {
        const { subtle } = globalThis.crypto;
        const importKey = subtle.importKey.bind(subtle);
        let heldPortsAtCheck;
        const spy = vi.spyOn(subtle, 'importKey').mockImplementation((...args) => {
          heldPortsAtCheck ??= heldPorts().length;
          return importKey(...args);
        });
        return async () => {
          await vi.waitFor(() => expect(spy).toHaveBeenCalled());
          await spy.mock.results[0].value;
          await flushAsync();
          return heldPortsAtCheck;
        };
      }

      it('leaves the session to the background, keeping it past its own timeout', async () => {
        const { auth, ui, session } = await openUnlockedExtensionPage();
        expect(heldPorts()).toHaveLength(1);

        vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
        ui.isAppActive.value = false;
        await nextTick();
        await vi.advanceTimersByTimeAsync(+auth.secureLoginTimeoutDecrypted.value);

        expect(heldPorts()).toHaveLength(0);
        // Another page may still be shown, the background removes it once none is.
        expect(session.store.exportedEncryptionKey).toBeDefined();
      });

      it.each([
        ['keeps the session again when shown before the timeout', 299999, true],
        ['locks when shown after the timeout, without keeping the session', 300000, false],
      ])('%s', async (_, hiddenMs, isUnlocked) => {
        const { auth, ui } = await openUnlockedExtensionPage();
        const keyChecked = watchKeyCheck();

        await hideAndShow(ui, hiddenMs);
        // Held before the check, so the background can't time the key out in between.
        expect(await keyChecked()).toBe(isUnlocked ? 1 : 0);

        await vi.waitFor(() => {
          expect(auth.isAuthenticated.value).toBe(isUnlocked);
          expect(heldPorts()).toHaveLength(isUnlocked ? 1 : 0);
        });
      });

      it.each([
        ['stays unlocked when shown while another page still keeps the session', true],
        ['locks when shown once the background timed the session out', false],
      ])('a page unlocked while hidden %s', async (_, isKeyKept) => {
        const { session } = await openUnlockedExtensionPage();

        // Reopened in the background, unlocking with the session key.
        vi.resetModules();
        globalThis.browser.runtime.connect.mockClear();
        const { useAuth } = await import('@/composables/auth');
        const { useUi } = await import('@/composables/ui');
        const reopened = useAuth();
        const ui = useUi();
        ui.isAppActive.value = false;
        await vi.waitFor(() => expect(reopened.isAuthenticated.value).toBe(true), WAIT_FOR_CRYPTO);
        await vi.waitFor(() => expect(heldPorts()).toHaveLength(0));

        // Shown long after any timeout: whether the key ran out is the background's call.
        vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 24 * 60 * 60 * 1000);
        if (isKeyKept) {
          const keyChecked = watchKeyCheck();
          ui.isAppActive.value = true;
          expect(await keyChecked()).toBe(1);
        } else {
          delete session.store.exportedEncryptionKey;
          ui.isAppActive.value = true;
        }

        await vi.waitFor(() => {
          expect(reopened.isAuthenticated.value).toBe(isKeyKept);
          expect(heldPorts()).toHaveLength(isKeyKept ? 1 : 0);
        });
      });

      it('leaves the session to the background from a dapp popup, even when shown', async () => {
        const { ui } = await openUnlockedExtensionPage({ RUNNING_IN_POPUP: true });
        const { SESSION_METHODS } = await import('@/constants');

        await vi.waitFor(() => expect(heldPorts()).toHaveLength(0));
        const [port] = globalThis.browser.runtime.connect.mock.results.map(({ value }) => value);
        expect(port.postMessage).toHaveBeenCalledWith({ method: SESSION_METHODS.sessionKeyStored });
        expect(port.postMessage.mock.invocationCallOrder[0])
          .toBeLessThan(port.disconnect.mock.invocationCallOrder[0]);

        const keyChecked = watchKeyCheck();
        await hideAndShow(ui);
        await keyChecked();
        expect(heldPorts()).toHaveLength(0);
      });

      it.each([
        ['a dapp popup', { RUNNING_IN_POPUP: true }],
        ['a wallet page a website frames', { IN_FRAME: true }],
      ])('leaves the timeout running when %s unlocks with the session key', async (_, constants) => {
        await openUnlockedExtensionPage();

        vi.resetModules();
        mockConstants({ IS_EXTENSION: true, ...constants });
        globalThis.browser.runtime.connect.mockClear();
        const { useAuth } = await import('@/composables/auth');
        const { useUi } = await import('@/composables/ui');
        const reopened = useAuth();
        useUi().isAppActive.value = true;
        await vi.waitFor(() => expect(reopened.isAuthenticated.value).toBe(true), WAIT_FOR_CRYPTO);
        await flushAsync();

        // A session port's disconnect restarts the background's timeout.
        expect(globalThis.browser.runtime.connect).not.toHaveBeenCalled();
      });

      it('leaves the session to the background once a page unlocked while hidden passed the key on', async () => {
        mockConstants({ IS_EXTENSION: true });
        const session = installExtensionStubs();
        const { useAuth } = await import('@/composables/auth');
        const { useUi } = await import('@/composables/ui');
        const { SESSION_METHODS } = await import('@/constants');
        const auth = useAuth();
        useUi().isAppActive.value = false;
        await flushAsync();

        await auth.setPassword('a-real-password', VALID_MNEMONIC);
        await vi.waitFor(() => {
          expect(session.store.exportedEncryptionKey).toBeDefined();
          expect(heldPorts()).toHaveLength(0);
        }, WAIT_FOR_CRYPTO);

        // The offscreen tab learns about the key only through the port.
        const [port] = globalThis.browser.runtime.connect.mock.results.map(({ value }) => value);
        expect(port.postMessage).toHaveBeenCalledWith({ method: SESSION_METHODS.sessionKeyStored });
        expect(port.postMessage.mock.invocationCallOrder[0])
          .toBeLessThan(port.disconnect.mock.invocationCallOrder[0]);
      });

      it('leaves the session to the background after rotating a legacy password while hidden', async () => {
        mockConstants({ IS_EXTENSION: true });
        const session = installExtensionStubs();
        const {
          encodeBase64, encrypt, generateEncryptionKey, generateSalt,
        } = await import('@/utils/crypto');
        const { WalletStorage } = await import('@/lib/WalletStorage');
        const { STORAGE_KEYS } = await import('@/constants');
        // Stored by the pre-upgrade "skip password" flow.
        const salt = generateSalt();
        const legacySalt = encodeBase64(salt);
        const legacyKey = await generateEncryptionKey('testPassword123', salt);
        WalletStorage.set(STORAGE_KEYS.encryptionSalt, legacySalt);
        WalletStorage.set(STORAGE_KEYS.mnemonic, await encrypt(legacyKey, VALID_MNEMONIC));

        const { useAuth } = await import('@/composables/auth');
        const auth = useAuth(); // Unlocks with it and rotates it, never shown.

        await vi.waitFor(() => {
          expect(auth.isAuthenticated.value).toBe(true);
          expect(WalletStorage.get(STORAGE_KEYS.encryptionSalt)).not.toBe(legacySalt);
          expect(session.store.exportedEncryptionKey).toBeDefined();
          expect(heldPorts()).toHaveLength(0);
        }, WAIT_FOR_CRYPTO);
      });
    });
  });

  describe('isMnemonicEncrypted inference', () => {
    it('is false for an empty mnemonic, true for an encrypted blob, false for valid plaintext, true for invalid plaintext', async () => {
      const { useAuth } = await import('@/composables/auth');
      const auth = useAuth();
      await flushAsync();

      expect(auth.mnemonic.value).toBe('');
      expect(auth.isMnemonicEncrypted.value).toBe(false); // empty string -> never "encrypted"

      await auth.setPassword('some-password', VALID_MNEMONIC);
      await nextTick();
      expect(auth.mnemonic.value).not.toBe(VALID_MNEMONIC);
      expect(auth.isMnemonicEncrypted.value).toBe(true); // real ciphertext -> encrypted

      auth.mnemonic.value = VALID_MNEMONIC;
      await nextTick();
      expect(auth.isMnemonicEncrypted.value).toBe(false); // valid BIP-39 plaintext -> not encrypted

      auth.mnemonic.value = 'this is not a bip39 mnemonic at all';
      await nextTick();
      // Documents CURRENT behavior: any non-empty string that fails BIP-39
      // validation is inferred as "encrypted", even garbage/corrupt plaintext that
      // was never actually encrypted.
      expect(auth.isMnemonicEncrypted.value).toBe(true);
    });
  });

  describe('mobile decrypt failure', () => {
    it('does not set isAuthenticated when the persisted mnemonic ciphertext is corrupted', async () => {
      mockConstants({ IS_MOBILE_APP: true });

      const { useAuth } = await import('@/composables/auth');
      const auth = useAuth();
      await auth.setMnemonicAndInitializeAuthentication(VALID_MNEMONIC);

      expect(auth.isAuthenticated.value).toBe(true);
      expect(auth.isMnemonicEncrypted.value).toBe(true);

      // Corrupt the on-disk ciphertext directly (simulates bit rot / a corrupted
      // backup) while leaving the per-install mobile key intact, so the failure is
      // specifically an AES-GCM auth-tag mismatch on the CIPHERTEXT - not a
      // missing/rotated key (that scenario is already covered by
      // auth.mobile.spec.ts's Keychain-wipe test).
      const { SecureMobileStorage } = await import('@/lib/SecureMobileStorage');
      const { STORAGE_KEYS } = await import('@/constants');
      const stored: string = await SecureMobileStorage.get(STORAGE_KEYS.mnemonic);
      expect(stored).toBeTruthy();
      const lastChar = stored.at(-1);
      const corrupted = `${stored.slice(0, -1)}${lastChar === 'A' ? 'B' : 'A'}`;
      await SecureMobileStorage.set(STORAGE_KEYS.mnemonic, corrupted);

      vi.resetModules();
      const { useAuth: useAuthRestarted } = await import('@/composables/auth');
      const authRestarted = useAuthRestarted();
      await flushAsync();

      await authRestarted.checkUserAuth();

      expect(authRestarted.isAuthenticated.value).toBe(false);
      expect(authRestarted.mnemonicDecrypted.value).toBe('');
      expect(loggerWriteMock).toHaveBeenCalledWith(expect.objectContaining({
        type: 'api-response',
        modal: false,
      }));
      // The key is intact, so this is the "can't decrypt" case, not "key unavailable".
      expect(openConfirmModalMock).toHaveBeenCalledWith(expect.objectContaining({
        msg: en.auth.walletDataUnreadableMessage,
      }));
    });
  });

  describe('stored seed that cannot be read', () => {
    it('stays locked on the web and suggests to reopen before the reset', async () => {
      mockConstants();
      const { STORAGE_KEYS } = await import('@/constants');
      const { composeStorageKeys } = await import('@/utils/common');
      localStorage.setItem(composeStorageKeys(STORAGE_KEYS.mnemonic), '{"cut off');
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const { useAuth } = await import('@/composables/auth');
      const auth = useAuth();

      try {
        await auth.checkUserAuth();
      } finally {
        warnSpy.mockRestore();
      }

      expect(auth.isMnemonicUnreadable.value).toBe(true);
      expect(auth.isAuthenticated.value).toBe(false);
      // Nothing was decrypted, and a failed extension storage read may work next time.
      expect(openConfirmModalMock).toHaveBeenCalledWith(expect.objectContaining({
        msg: en.auth.walletDataReadFailedMessage,
      }));
    });
  });

  describe('stale session key (extension)', () => {
    let session;

    // The popup dies after the new mnemonic is saved but before its key reaches the session.
    async function leaveStaleSessionKey() {
      openSetPasswordModalMock.mockResolvedValue('old-password');
      const { useAuth } = await import('@/composables/auth');
      const auth = useAuth();
      await auth.setMnemonicAndInitializeAuthentication(VALID_MNEMONIC);
      await flushAsync();
      const staleKey = session.store.exportedEncryptionKey;
      expect(staleKey).toBeDefined();

      session.set.mockImplementationOnce(() => Promise.resolve());
      await auth.updatePassword('old-password', 'new-password');
      await flushAsync();
      expect(session.store.exportedEncryptionKey).toBe(staleKey);
    }

    beforeEach(async () => {
      mockConstants({ IS_EXTENSION: true });
      session = installExtensionStubs();
      // `handleUnknownError` reports the failed decrypt.
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      await leaveStaleSessionKey();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    async function restart() {
      vi.resetModules();
      const { useAuth } = await import('@/composables/auth');
      const { useUi } = await import('@/composables/ui');
      const auth = useAuth();
      // The boot-time `checkUserAuth` ends at the password modal.
      await vi.waitFor(
        () => expect(openPasswordLoginModalMock).toHaveBeenCalled(),
        { timeout: 10000 },
      );
      return { auth, ui: useUi() };
    }

    it('falls back to the password modal without publishing a key that does not open the mnemonic', async () => {
      session.set.mockClear();
      const { auth, ui } = await restart();
      expect(session.set).not.toHaveBeenCalled();
      expect(auth.isAuthenticated.value).toBe(false);
      expect(auth.encryptionKey.value).toBeUndefined();
      expect(ui.isLoaderVisible.value).toBe(false);

      expect(await auth.authenticateWithPassword('new-password')).toBe(true);
      expect(auth.mnemonicDecrypted.value).toBe(VALID_MNEMONIC);
    });

    it('drops the stale key so later reopens go straight to the password modal', async () => {
      await restart();
      expect(session.store).toEqual({});

      openPasswordLoginModalMock.mockClear();
      await restart();
    });

    it('still falls back to the password modal when the stale key cannot be dropped', async () => {
      session.remove.mockRejectedValueOnce(new Error('Storage unavailable'));
      const { auth, ui } = await restart();
      expect(auth.encryptionKey.value).toBeUndefined();
      expect(ui.isLoaderVisible.value).toBe(false);
    });
  });
});
