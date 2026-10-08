// @ts-nocheck
import { nextTick } from 'vue';
import en from '@/popup/locales/en-US.json';

/**
 * Targeted branch coverage for `useAuth`'s state machine, extending
 * `auth.mobile.spec.ts` / `auth.offscreenSessionSync.spec.ts` rather than duplicating
 * their scenarios. Same mocking style: REAL WebCrypto (`@/utils/crypto`, unmocked
 * except in one test that narrowly wraps `encrypt`), REAL `useStorageRef`/localStorage
 * (including a thin pass-through wrapper around `@/lib/WalletStorage`'s `set` so one
 * test can inject a write failure for a single storage key), REAL
 * `@/composables/defaultPassword`. Only mocked:
 *   - `@aparajita/capacitor-biometric-auth` - native hardware, unavailable in jsdom.
 *   - `@/composables/modals` - modal *components* aren't mounted here.
 *   - `@/lib/logger` - side-effecting telemetry.
 *   - `@/constants` - to force `IS_MOBILE_APP`/`IS_EXTENSION`/etc per test, since
 *     jsdom has no real platform to detect; every other constant stays real.
 *   - `@/lib/WalletStorage` (one test only) - to make a single storage key's `set`
 *     throw, simulating e.g. a `QuotaExceededError` mid-persistence.
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

function makeSessionStorageStub() {
  const store: Record<string, unknown> = {};
  return {
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

describe('useAuth state machine branches', () => {
  let openSetPasswordModalMock;
  let openBiometricLoginModalMock;
  let openPasswordLoginModalMock;
  let openEnableBiometricLoginModalMock;
  let openConfirmModalMock;
  let loggerWriteMock;
  let walletStorageSetMock;

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

    openSetPasswordModalMock = vi.fn().mockResolvedValue('unused-modal-password');
    openBiometricLoginModalMock = vi.fn().mockResolvedValue(undefined);
    openPasswordLoginModalMock = vi.fn().mockResolvedValue(undefined);
    openEnableBiometricLoginModalMock = vi.fn().mockResolvedValue(undefined);
    openConfirmModalMock = vi.fn(() => new Promise(() => {}));
    loggerWriteMock = vi.fn();
    // Default: pure pass-through to the real WalletStorage.set implementation.
    // Individual tests may override this to inject a failure for one storage key.
    walletStorageSetMock = vi.fn((keys, value, realSet) => realSet(keys, value));

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
    vi.doMock('@/lib/WalletStorage', async (importOriginal) => {
      const actual: any = await importOriginal();
      return {
        ...actual,
        WalletStorage: {
          ...actual.WalletStorage,
          set: (keys: any, value: any) => (
            walletStorageSetMock(keys, value, actual.WalletStorage.set)
          ),
        },
      };
    });
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

    // `setPassword` commits the new salt+ciphertext PAIR to the underlying
    // storage synchronously (with rollback on failure) before touching the
    // reactive `encryptionSalt`/`mnemonic` refs. If the salt's write succeeds
    // but the mnemonic's write then fails, the salt write is rolled back to its
    // previous on-disk value and `setPassword` rejects - disk never ends up
    // holding a NEW salt paired with the OLD ciphertext (which would be
    // undecryptable by either password).
    it('rolls back the salt and rejects when the mnemonic storage write fails after the salt write already succeeded', async () => {
      const { useAuth } = await import('@/composables/auth');
      const auth = useAuth();

      await auth.setPassword('old-password', VALID_MNEMONIC);
      await nextTick();
      await flushAsync();

      const { composeStorageKeys } = await import('@/utils/common');
      const { STORAGE_KEYS } = await import('@/constants');
      const mnemonicComposedKey = composeStorageKeys(STORAGE_KEYS.mnemonic);
      const saltComposedKey = composeStorageKeys(STORAGE_KEYS.encryptionSalt);
      const oldCiphertextOnDisk = localStorage.getItem(mnemonicComposedKey);
      const oldSaltOnDisk = localStorage.getItem(saltComposedKey);
      const saltRefBeforeFailure = auth.encryptionSalt.value;
      const mnemonicRefBeforeFailure = auth.mnemonic.value;
      expect(oldCiphertextOnDisk).toBeTruthy();
      expect(oldSaltOnDisk).toBeTruthy();

      // The mnemonic write throws (e.g. QuotaExceededError); the encryptionSalt
      // write is left untouched and succeeds normally.
      walletStorageSetMock.mockImplementation((keys: any, value: any, realSet: any) => {
        if (composeStorageKeys(keys) === mnemonicComposedKey) {
          throw new Error('simulated storage quota exceeded on mnemonic write');
        }
        return realSet(keys, value);
      });

      await expect(auth.setPassword('new-password', VALID_MNEMONIC))
        .rejects.toThrow('simulated storage quota exceeded on mnemonic write');
      await nextTick();
      await flushAsync();

      // Disk still holds the OLD salt (rolled back) and the OLD ciphertext
      // (never overwritten) - a consistent pair, not a mismatched one.
      expect(localStorage.getItem(saltComposedKey)).toBe(oldSaltOnDisk);
      expect(localStorage.getItem(mnemonicComposedKey)).toBe(oldCiphertextOnDisk);
      // The reactive refs were never assigned either - `setPassword` threw
      // before reaching them.
      expect(auth.encryptionSalt.value).toEqual(saltRefBeforeFailure);
      expect(auth.mnemonic.value).toBe(mnemonicRefBeforeFailure);

      // Restore normal storage behavior before restarting - `useStorageRef`'s
      // restore IIFE writes the restored value back to storage on every boot.
      walletStorageSetMock.mockImplementation(
        (keys: any, value: any, realSet: any) => realSet(keys, value),
      );

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
      const { composeStorageKeys } = await import('@/utils/common');
      return localStorage.getItem(composeStorageKeys(STORAGE_KEYS[name]));
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
      // A watcher re-encrypts it after the key switch.
      await vi.waitFor(async () => (
        expect(await readStorage('secureLoginTimeout')).not.toBe(timeoutCiphertext)
      ));

      await expectReadableAfterRestart('new-password');
    });

    it('keeps the wallet data readable when the wallet locks right after the change', async () => {
      const auth = await createWallet();
      const timeoutCiphertext = await readStorage('secureLoginTimeout');

      await auth.updatePassword('old-password', 'new-password');
      // The watcher is still re-encrypting under the new key.
      await auth.lockWallet();
      await vi.waitFor(async () => (
        expect(await readStorage('secureLoginTimeout')).not.toBe(timeoutCiphertext)
      ));

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

  describe('failed default-password guess (extension)', () => {
    it('clears only the reactive encryptionKey and does not call sessionEnd(), preserving a valid background session', async () => {
      mockConstants({ IS_EXTENSION: true });
      // Extend (not replace) the global `browser` stub. `@/utils/session.ts`
      // imports `@/offscreen/popupHandler`, whose first line imports
      // `@/lib/initPolyfills` - which, outside an extension build, UNCONDITIONALLY
      // overwrote `window.browser` with a reduced stub (no `runtime.connect`, no
      // `storage.session`) the very first time this file's module graph loaded
      // (via `registerAdapters`, before this `beforeEach`'s mocks could apply).
      // Mocking `@/offscreen/popupHandler` from here on prevents further stomping,
      // but doesn't undo that first hit - so `runtime.connect` and
      // `storage.session` are added back explicitly here.
      globalThis.browser.runtime.connect = vi.fn(() => ({
        onMessage: { addListener: vi.fn() },
        onDisconnect: { addListener: vi.fn() },
        postMessage: vi.fn(),
      }));
      globalThis.browser.storage.session = makeSessionStorageStub();

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
});
