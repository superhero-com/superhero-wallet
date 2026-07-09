// @ts-nocheck
import { nextTick } from 'vue';

/**
 * Exercises `useAuth`'s mobile biometric-login lifecycle against REAL crypto
 * (Web Crypto via Node's `globalThis.crypto.subtle`) and REAL storage (`useStorageRef`
 * backed by jsdom `localStorage`, including `SecureMobileStorage`'s web fallback which
 * is also plain `localStorage` under the hood). Only three things are mocked:
 *   - `@aparajita/capacitor-biometric-auth` - native hardware, unavailable in jsdom.
 *   - `@/composables/modals` - real modal *components* aren't mounted here, so the
 *     three modal openers `auth.ts` calls are stubbed to control resolve/reject timing.
 *   - `@/lib/logger` - side-effecting telemetry, irrelevant to what's under test.
 *   - `@/constants` - only to force `IS_MOBILE_APP`/`IS_EXTENSION`/etc, since jsdom has
 *     no real Ionic native platform to detect; every other constant stays real.
 * Everything else (`useStorageRef`, `useUi`, migrations, `@/utils` crypto helpers,
 * `@/composables/defaultPassword`) runs unmocked.
 *
 * `useAuth`/`useUi` are per-module singletons (`createCustomScopedComposable`), so an
 * app restart is simulated with `vi.resetModules()` + a fresh dynamic import - state
 * carries over via the real, un-cleared `localStorage`, exactly like a real relaunch.
 */
const VALID_MNEMONIC = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

function flushAsync() {
  return new Promise((resolve) => { setTimeout(resolve, 0); });
}

describe('useAuth on mobile', () => {
  let checkBiometryMock;
  let biometricAuthenticateMock;
  let openBiometricLoginModalMock;
  let openPasswordLoginModalMock;
  let openEnableBiometricLoginModalMock;
  let loggerWriteMock;

  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();

    checkBiometryMock = vi.fn().mockResolvedValue({ isAvailable: true });
    biometricAuthenticateMock = vi.fn().mockResolvedValue(undefined);
    openBiometricLoginModalMock = vi.fn().mockResolvedValue(undefined);
    openPasswordLoginModalMock = vi.fn().mockResolvedValue(undefined);
    openEnableBiometricLoginModalMock = vi.fn().mockResolvedValue(undefined);
    loggerWriteMock = vi.fn();

    // All `vi.doMock` calls must be registered here, before any dynamic import below -
    // vitest's global `registerAdapters` setup file transitively loads the real
    // `@/composables` barrel (and everything in it, including `auth.ts` and its
    // dependencies) before this file's tests run; mocking afterwards would be too late.
    vi.doMock('@aparajita/capacitor-biometric-auth', () => ({
      BiometricAuth: {
        checkBiometry: (...args) => checkBiometryMock(...args),
        authenticate: (...args) => biometricAuthenticateMock(...args),
      },
    }));
    vi.doMock('@/constants', async () => {
      const actual = await vi.importActual('@/constants');
      return {
        ...actual,
        IS_MOBILE_APP: true,
        IS_EXTENSION: false,
        IS_IOS: false,
        IS_OFFSCREEN_TAB: false,
        RUNNING_IN_TESTS: false,
      };
    });
    vi.doMock('@/composables/modals', () => ({
      useModals: () => ({
        openBiometricLoginModal: (...args) => openBiometricLoginModalMock(...args),
        openPasswordLoginModal: (...args) => openPasswordLoginModalMock(...args),
        openEnableBiometricLoginModal: (...args) => openEnableBiometricLoginModalMock(...args),
      }),
    }));
    vi.doMock('@/lib/logger', () => ({
      __esModule: true,
      default: { write: (...args) => loggerWriteMock(...args) },
    }));
  });

  /** Boots a fresh `useAuth()` + `useUi()` pair against the current module generation. */
  async function boot() {
    const { useAuth } = await import('@/composables/auth');
    const { useUi } = await import('@/composables/ui');
    return { auth: useAuth(), ui: useUi() };
  }

  /** Simulates an app restart: fresh module registry, same on-disk state. */
  async function restart() {
    vi.resetModules();
    const booted = await boot();
    await flushAsync(); // let every storageRef finish restoring from localStorage
    return booted;
  }

  it('encrypts a new mnemonic with a fresh per-install mobile key, decryptable back to the original phrase', async () => {
    const { auth } = await boot();

    await auth.setMnemonicAndInitializeAuthentication(VALID_MNEMONIC);

    expect(auth.isAuthenticated.value).toBe(true);
    expect(auth.mnemonicDecrypted.value).toBe(VALID_MNEMONIC);
    expect(auth.isMnemonicEncrypted.value).toBe(true);
    expect(auth.mnemonic.value).not.toBe(VALID_MNEMONIC);

    const { decrypt } = await import('@/utils/crypto');
    await expect(decrypt(auth.encryptionKey.value, auth.mnemonic.value))
      .resolves.toBe(VALID_MNEMONIC);
  });

  it('restores the encrypted mnemonic and unlocks via biometric auth after a simulated app restart', async () => {
    const { auth: authGen1, ui: uiGen1 } = await boot();
    uiGen1.setBiometricLoginEnabled(true);
    await authGen1.setMnemonicAndInitializeAuthentication(VALID_MNEMONIC);

    const { auth, ui } = await restart();
    ui.isAppActive.value = true;

    await auth.checkUserAuth();

    expect(openBiometricLoginModalMock).toHaveBeenCalledTimes(1);
    expect(auth.isAuthenticated.value).toBe(true);
    expect(auth.mnemonicDecrypted.value).toBe(VALID_MNEMONIC);
  });

  it('keeps the wallet locked when the biometric login prompt is dismissed', async () => {
    const { auth: authGen1, ui: uiGen1 } = await boot();
    uiGen1.setBiometricLoginEnabled(true);
    await authGen1.setMnemonicAndInitializeAuthentication(VALID_MNEMONIC);

    openBiometricLoginModalMock.mockRejectedValue(new Error('dismissed'));
    const { auth, ui } = await restart();
    ui.isAppActive.value = true;

    await auth.checkUserAuth();

    expect(auth.isAuthenticated.value).toBe(false);
    expect(auth.mnemonicDecrypted.value).toBe('');
  });

  it('unblocks concurrent auth checks when the biometric login prompt is dismissed', async () => {
    const { auth: authGen1, ui: uiGen1 } = await boot();
    uiGen1.setBiometricLoginEnabled(true);
    await authGen1.setMnemonicAndInitializeAuthentication(VALID_MNEMONIC);

    let rejectModal;
    openBiometricLoginModalMock.mockImplementation(() => new Promise((_resolve, reject) => {
      rejectModal = reject;
    }));

    const { auth, ui } = await restart();
    ui.isAppActive.value = true;

    const firstCheck = auth.checkUserAuth();
    while (openBiometricLoginModalMock.mock.calls.length === 0) {
      // eslint-disable-next-line no-await-in-loop
      await flushAsync();
    }
    const secondCheck = auth.checkUserAuth();
    await flushAsync();

    rejectModal(new Error('dismissed'));

    await expect(firstCheck).resolves.toBeUndefined();
    await expect(secondCheck).resolves.toBeUndefined();
    expect(openBiometricLoginModalMock).toHaveBeenCalledTimes(1);
    expect(auth.isAuthenticated.value).toBe(false);
  });

  it('forces biometric verification on manual lock/authenticate even when biometric login is disabled', async () => {
    const { auth: authGen1 } = await boot(); // biometric login stays disabled (default)
    await authGen1.setMnemonicAndInitializeAuthentication(VALID_MNEMONIC);

    const { auth } = await restart();
    await auth.checkUserAuth(); // auto-unlocks without a prompt, since it's disabled
    expect(auth.isAuthenticated.value).toBe(true);
    expect(openBiometricLoginModalMock).not.toHaveBeenCalled();

    await auth.lockWallet();
    expect(openBiometricLoginModalMock).toHaveBeenCalledWith({
      force: true,
      deferAuthStateUpdate: true,
    });
    expect(auth.isAuthenticated.value).toBe(true);

    await auth.logout();
    expect(auth.isAuthenticated.value).toBe(false);

    await auth.authenticateWithBiometry(true);
    expect(biometricAuthenticateMock).toHaveBeenCalledTimes(1);
    expect(auth.isAuthenticated.value).toBe(true);
  });

  it('does not auto-lock on app resume when biometric login is disabled', async () => {
    const { auth: authGen1 } = await boot(); // biometric login stays disabled (default)
    await authGen1.setMnemonicAndInitializeAuthentication(VALID_MNEMONIC);

    const { auth, ui } = await restart();
    ui.isAppActive.value = true;
    await auth.checkUserAuth();
    expect(auth.isAuthenticated.value).toBe(true);

    ui.isAppActive.value = false;
    await nextTick();
    ui.isAppActive.value = true;
    await nextTick();
    await flushAsync();

    expect(openBiometricLoginModalMock).not.toHaveBeenCalled();
    expect(auth.isAuthenticated.value).toBe(true);
  });

  it('auto re-locks and re-prompts biometric when the app is backgrounded and resumed (immediate mobile timeout)', async () => {
    const { auth: authGen1, ui: uiGen1 } = await boot();
    uiGen1.setBiometricLoginEnabled(true);
    await authGen1.setMnemonicAndInitializeAuthentication(VALID_MNEMONIC);

    const { auth, ui } = await restart();
    ui.isAppActive.value = true;
    await auth.checkUserAuth();
    expect(auth.isAuthenticated.value).toBe(true);
    expect(openBiometricLoginModalMock).toHaveBeenCalledTimes(1);

    // Mobile's default authentication timeout is 0ms (AUTHENTICATION_TIMEOUTS[0]), so
    // backgrounding expires the session immediately; resuming should auto re-lock and
    // re-prompt biometric without any explicit `checkUserAuth()` call from the test.
    ui.isAppActive.value = false;
    await nextTick();
    ui.isAppActive.value = true;
    await nextTick();

    // Wait for both the second prompt AND the resulting re-authentication to settle -
    // checking only the call count races `markAuthenticated()`, which runs a few
    // microtask hops after the mock is invoked (and after the mock's own promise
    // resolves), and can lose that race under heavy parallel test-suite load.
    while (openBiometricLoginModalMock.mock.calls.length < 2 || !auth.isAuthenticated.value) {
      // eslint-disable-next-line no-await-in-loop
      await flushAsync();
    }

    expect(auth.isAuthenticated.value).toBe(true);
  });

  it('surfaces an error and stays locked when the persisted mnemonic cannot be decrypted with the current mobile key', async () => {
    const { auth: authGen1 } = await boot();
    await authGen1.setMnemonicAndInitializeAuthentication(VALID_MNEMONIC);

    // Simulate a Keychain wipe: the mobile encryption key is gone, but the mnemonic
    // ciphertext (encrypted under the OLD key) is still on disk.
    const { SecureMobileStorage } = await import('@/lib/SecureMobileStorage');
    const { STORAGE_KEYS } = await import('@/constants');
    await SecureMobileStorage.remove(STORAGE_KEYS.mobileDataKey);

    const { auth } = await restart(); // mints a NEW mobile key that won't match the old ciphertext
    await auth.checkUserAuth();

    expect(auth.isAuthenticated.value).toBe(false);
    expect(auth.mnemonicDecrypted.value).toBe('');
    expect(loggerWriteMock).toHaveBeenCalledWith(expect.objectContaining({
      type: 'api-response',
      modal: true,
    }));
  });
});
