// @ts-nocheck
import { nextTick } from 'vue';

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

      await expect(auth.setPassword('new-password'))
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

    // BUG (documented, not fixed): the front-loaded derivation above only protects
    // against a throw BEFORE any state is committed. `encryptionSalt.value` and
    // `mnemonic.value` are two INDEPENDENT storage-backed refs, each persisted by
    // its own fire-and-forget watcher (`useStorageRef`'s `setStorageState`, never
    // awaited by the ref assignment that triggers it). If the salt write succeeds
    // but the mnemonic write fails right after, on-disk state ends up with a NEW
    // salt paired with the OLD ciphertext - undecryptable by EITHER password, not
    // just decryptable-by-old-password as the plan/code-comment intend. See
    // TEST_IMPROVEMENT_PLAN.md "Potential bugs found" for the write-up.
    it.fails('BUG: a storage-write failure on the mnemonic key after the salt write already succeeded bricks the account (neither old nor new password decrypts)', async () => {
      const { useAuth } = await import('@/composables/auth');
      const auth = useAuth();

      await auth.setPassword('old-password', VALID_MNEMONIC);
      await nextTick();
      await flushAsync();

      const { composeStorageKeys } = await import('@/utils/common');
      const { STORAGE_KEYS } = await import('@/constants');
      const mnemonicComposedKey = composeStorageKeys(STORAGE_KEYS.mnemonic);
      const oldCiphertextOnDisk = localStorage.getItem(mnemonicComposedKey);
      expect(oldCiphertextOnDisk).toBeTruthy();

      // The mnemonic write throws (e.g. QuotaExceededError); the encryptionSalt
      // write is left untouched and succeeds normally.
      walletStorageSetMock.mockImplementation((keys: any, value: any, realSet: any) => {
        if (composeStorageKeys(keys) === mnemonicComposedKey) {
          throw new Error('simulated storage quota exceeded on mnemonic write');
        }
        return realSet(keys, value);
      });

      // The failing write happens inside a fire-and-forget watcher (never awaited
      // by `setPassword`), so it surfaces as a genuine unhandled rejection rather
      // than a rejection of `setPassword` itself - capture it instead of letting it
      // fail the whole test run.
      const capturedRejections: unknown[] = [];
      const onUnhandledRejection = (reason: unknown) => { capturedRejections.push(reason); };
      process.on('unhandledRejection', onUnhandledRejection);
      try {
        await auth.setPassword('new-password'); // resolves fine - the failure is async
        await nextTick();
        await flushAsync();
      } finally {
        process.off('unhandledRejection', onUnhandledRejection);
      }

      // Sanity: the injected failure actually fired (if this fails, the mock wiring
      // is broken, not the bug under test).
      expect(capturedRejections.length).toBeGreaterThan(0);
      // The mnemonic write failed - on-disk ciphertext is still the OLD one.
      expect(localStorage.getItem(mnemonicComposedKey)).toBe(oldCiphertextOnDisk);

      // Restore normal storage behavior before restarting - `useStorageRef`'s
      // restore IIFE unconditionally writes migrated values back to storage on
      // every boot, and that write-back must not also hit our injected failure
      // (it would just be more unhandled-rejection noise, not part of the bug).
      walletStorageSetMock.mockImplementation(
        (keys: any, value: any, realSet: any) => realSet(keys, value),
      );

      vi.resetModules();
      const { useAuth: useAuthRestarted } = await import('@/composables/auth');
      const authRestarted = useAuthRestarted();
      await flushAsync();

      // EXPECTED per TEST_IMPROVEMENT_PLAN.md Task 1.3: a mid-flow failure must
      // leave on-disk state decryptable with the OLD password.
      // ACTUAL: `encryptionSalt` was already rotated to the NEW salt (that write
      // succeeded) before the mnemonic write failed, so the OLD ciphertext still on
      // disk is now paired with a salt it was never encrypted under. Decrypting
      // with the OLD password derives the wrong key against `encryptionSalt` and
      // throws an AES-GCM auth-tag mismatch - the account is bricked, not merely
      // "still on the old password".
      const ok = await authRestarted.authenticateWithPassword('old-password');
      expect(ok).toBe(true);
      expect(authRestarted.mnemonicDecrypted.value).toBe(VALID_MNEMONIC);
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
        modal: true,
      }));
    });
  });
});
