// @ts-nocheck
import { nextTick } from 'vue';
import en from '@/popup/locales/en-US.json';

/**
 * Exercises `useAuth`'s mobile biometric-login lifecycle against REAL crypto
 * (Web Crypto via Node's `globalThis.crypto.subtle`) and REAL storage (`useStorageRef`
 * backed by jsdom `localStorage`, including `SecureMobileStorage`'s web fallback which
 * is also plain `localStorage` under the hood). Only three things are mocked:
 *   - `@aparajita/capacitor-biometric-auth` - native hardware, unavailable in jsdom.
 *   - `@/composables/modals` - real modal *components* aren't mounted here, so the
 *     modal openers `auth.ts` calls are stubbed to control resolve/reject timing.
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
const OTHER_VALID_MNEMONIC = 'legal winner thank year wave sausage worth useful legal winner thank yellow';
/** Real WebCrypto runs before these waits, which a loaded CI runner may stretch past 1 s. */
const WAIT_FOR_CRYPTO = { timeout: 5000 };

function flushAsync() {
  return new Promise((resolve) => { setTimeout(resolve, 0); });
}

describe('useAuth on mobile', () => {
  let checkBiometryMock;
  let biometricAuthenticateMock;
  let openBiometricLoginModalMock;
  let openPasswordLoginModalMock;
  let openEnableBiometricLoginModalMock;
  let openConfirmModalMock;
  let openModalMock;
  let loggerWriteMock;

  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();

    checkBiometryMock = vi.fn().mockResolvedValue({ isAvailable: true });
    biometricAuthenticateMock = vi.fn().mockResolvedValue(undefined);
    openBiometricLoginModalMock = vi.fn().mockResolvedValue(undefined);
    openPasswordLoginModalMock = vi.fn().mockResolvedValue(undefined);
    openEnableBiometricLoginModalMock = vi.fn().mockResolvedValue(undefined);
    // Left unanswered unless a test resolves/rejects it.
    openConfirmModalMock = vi.fn(() => new Promise(() => {}));
    openModalMock = vi.fn().mockResolvedValue(undefined);
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
        openConfirmModal: (...args) => openConfirmModalMock(...args),
        openModal: (...args) => openModalMock(...args),
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
    // Lets every storageRef restore from localStorage, unless the key reads back empty:
    // then the mnemonic restore waits for the key retries (`checkUserAuth` waits for it).
    await flushAsync();
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

  it('shows the loader while a new mnemonic is being stored, and hides it before the biometric offer', async () => {
    const { auth, ui } = await boot();
    const { SecureMobileStorage } = await import('@/lib/SecureMobileStorage');
    const { STORAGE_KEYS } = await import('@/constants');
    const realSet = SecureMobileStorage.set;
    // The storage ref writes the mnemonic again later; the first write is the save itself.
    const loaderWhileStoring = [];
    vi.spyOn(SecureMobileStorage, 'set').mockImplementation((key, value) => {
      if (key === STORAGE_KEYS.mnemonic) loaderWhileStoring.push(ui.isLoaderVisible.value);
      return realSet(key, value);
    });
    openEnableBiometricLoginModalMock.mockImplementation(async () => {
      expect(ui.isLoaderVisible.value).toBe(false);
    });

    await auth.setMnemonicAndInitializeAuthentication(VALID_MNEMONIC);

    expect(loaderWhileStoring[0]).toBe(true);
    expect(openEnableBiometricLoginModalMock).toHaveBeenCalledTimes(1);
    expect(ui.isLoaderVisible.value).toBe(false);
  });

  it('hides the loader again when storing the new mnemonic fails', async () => {
    const { auth, ui } = await boot();
    const { SecureMobileStorage } = await import('@/lib/SecureMobileStorage');
    const { STORAGE_KEYS } = await import('@/constants');
    const realSet = SecureMobileStorage.set;
    vi.spyOn(SecureMobileStorage, 'set').mockImplementation((key, value) => (
      key === STORAGE_KEYS.mnemonic
        ? Promise.reject(new Error('Keychain write failed'))
        : realSet(key, value)
    ));

    await expect(auth.setMnemonicAndInitializeAuthentication(VALID_MNEMONIC))
      .rejects.toThrow('Keychain write failed');

    expect(ui.isLoaderVisible.value).toBe(false);
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

  it('does not write the stored seed back on restart', async () => {
    const { auth: authGen1 } = await boot();
    await authGen1.setMnemonicAndInitializeAuthentication(VALID_MNEMONIC);

    vi.resetModules();
    const { SecureMobileStorage } = await import('@/lib/SecureMobileStorage');
    const setSpy = vi.spyOn(SecureMobileStorage, 'set');
    const { auth } = await boot();
    await auth.checkUserAuth();
    await flushAsync();

    expect(auth.mnemonicDecrypted.value).toBe(VALID_MNEMONIC);
    expect(setSpy.mock.calls.filter(([key]) => key === 'mnemonic')).toHaveLength(0);
  });

  it('writes a legacy plaintext seed back once, encrypted', async () => {
    const { SecureMobileStorage } = await import('@/lib/SecureMobileStorage');
    await SecureMobileStorage.set('mnemonic', VALID_MNEMONIC);
    const setSpy = vi.spyOn(SecureMobileStorage, 'set');
    const { auth } = await boot();
    await auth.checkUserAuth();
    await flushAsync();

    const seedWrites = setSpy.mock.calls.filter(([key]) => key === 'mnemonic');
    expect(seedWrites).toHaveLength(1);
    expect(seedWrites[0][1]).not.toBe(VALID_MNEMONIC);
    expect(auth.mnemonicDecrypted.value).toBe(VALID_MNEMONIC);
  });

  it('preserves the key when all secure reads are empty at startup and unlocks after reads recover', async () => {
    const { auth: first } = await boot();
    await first.setMnemonicAndInitializeAuthentication(VALID_MNEMONIC);
    const { SecureMobileStorage: initialStorage } = await import('@/lib/SecureMobileStorage');
    const originalKey = await initialStorage.get('mobile-data-key');
    const originalMnemonic = await initialStorage.get('mnemonic');

    vi.resetModules();
    const { SecureMobileStorage } = await import('@/lib/SecureMobileStorage');
    const realGet = SecureMobileStorage.get;
    const emptyReads = vi.spyOn(SecureMobileStorage, 'get').mockResolvedValue(null);
    const setSpy = vi.spyOn(SecureMobileStorage, 'set');
    const { auth } = await boot();
    // Let the startup key-read retries finish (their delays are stubbed in setup).
    await flushAsync();
    await flushAsync();

    expect(auth.isAuthenticated.value).toBe(false);
    expect(setSpy.mock.calls.some(([key]) => key === 'mobile-data-key')).toBe(false);
    expect(await realGet('mobile-data-key')).toBe(originalKey);
    expect(await realGet('mnemonic')).toBe(originalMnemonic);

    emptyReads.mockRestore();
    setSpy.mockRestore();
    const { auth: recovered, ui } = await restart();
    ui.isAppActive.value = true;
    await recovered.checkUserAuth();
    expect(recovered.isAuthenticated.value).toBe(true);
    expect(recovered.mnemonicDecrypted.value).toBe(VALID_MNEMONIC);
  });

  it('finishes restoring a legacy wallet when native key creation rejects, then recovers on restart', async () => {
    const { SecureMobileStorage } = await import('@/lib/SecureMobileStorage');
    await SecureMobileStorage.set('mnemonic', VALID_MNEMONIC);
    const create = vi.spyOn(SecureMobileStorage, 'getOrCreate')
      .mockRejectedValue(new Error('Existing Keychain item could not be read'));
    const { auth } = await boot();

    await vi.waitFor(() => expect(auth.isMnemonicRestored.value).toBe(true), WAIT_FOR_CRYPTO);
    await auth.checkUserAuth();
    expect(auth.isAuthenticated.value).toBe(false);
    await expect(auth.checkUserAuth()).resolves.toBeUndefined();
    expect(await SecureMobileStorage.get('mnemonic')).toBe(VALID_MNEMONIC);
    expect(openConfirmModalMock).toHaveBeenCalledWith(expect.objectContaining({
      msg: en.auth.walletKeyUnavailableMessage,
    }));

    create.mockRestore();
    const { auth: recovered } = await restart();
    await recovered.checkUserAuth();
    expect(recovered.isAuthenticated.value).toBe(true);
    expect(recovered.mnemonicDecrypted.value).toBe(VALID_MNEMONIC);
    expect(await SecureMobileStorage.get('mnemonic')).not.toBe(VALID_MNEMONIC);
  });

  it('handles rejected key reads without hanging authentication and unlocks after recovery', async () => {
    const { auth: first } = await boot();
    await first.setMnemonicAndInitializeAuthentication(VALID_MNEMONIC);
    vi.resetModules();
    const { SecureMobileStorage } = await import('@/lib/SecureMobileStorage');
    const realGet = SecureMobileStorage.get;
    const storedKey = await realGet('mobile-data-key');
    const storedSeed = await realGet('mnemonic');
    const read = vi.spyOn(SecureMobileStorage, 'get').mockImplementation((key) => (
      key === 'mobile-data-key' ? Promise.reject(new Error('Keychain unavailable')) : realGet(key)
    ));
    const { auth } = await boot();
    await vi.waitFor(() => expect(auth.isMnemonicRestored.value).toBe(true), WAIT_FOR_CRYPTO);

    await expect(auth.checkUserAuth()).resolves.toBeUndefined();
    await expect(auth.checkUserAuth()).resolves.toBeUndefined();
    expect(auth.isAuthenticated.value).toBe(false);
    expect(await realGet('mobile-data-key')).toBe(storedKey);
    expect(await realGet('mnemonic')).toBe(storedSeed);
    expect(openConfirmModalMock).toHaveBeenCalledWith(expect.objectContaining({
      msg: en.auth.walletKeyUnavailableMessage,
    }));

    read.mockRestore();
    const { auth: recovered } = await restart();
    await recovered.checkUserAuth();
    expect(recovered.mnemonicDecrypted.value).toBe(VALID_MNEMONIC);
    expect(recovered.isAuthenticated.value).toBe(true);
  });

  it('stays locked and offers the reset when the stored seed read rejects, without writing a seed', async () => {
    const { auth: first } = await boot();
    await first.setMnemonicAndInitializeAuthentication(VALID_MNEMONIC);
    vi.resetModules();
    const { SecureMobileStorage } = await import('@/lib/SecureMobileStorage');
    const realGet = SecureMobileStorage.get;
    const storedSeed = await realGet('mnemonic');
    vi.spyOn(SecureMobileStorage, 'get').mockImplementation((key) => (
      key === 'mnemonic' ? Promise.reject(new Error('AEADBadTagException')) : realGet(key)
    ));
    const setSpy = vi.spyOn(SecureMobileStorage, 'set');
    const { auth } = await boot();

    await vi.waitFor(() => expect(auth.isMnemonicRestored.value).toBe(true), WAIT_FOR_CRYPTO);
    await expect(auth.checkUserAuth()).resolves.toBeUndefined();
    expect(auth.isAuthenticated.value).toBe(false);
    expect(auth.isMnemonicUnreadable.value).toBe(true);
    // The read may work next time, so reopening is suggested before a reset.
    expect(openConfirmModalMock).toHaveBeenCalledWith(expect.objectContaining({
      msg: en.auth.walletDataReadFailedMessage,
    }));

    await expect(auth.setMnemonicAndInitializeAuthentication(OTHER_VALID_MNEMONIC))
      .rejects.toThrow('AEADBadTagException');
    expect(setSpy.mock.calls.some(([key]) => key === 'mnemonic')).toBe(false);
    expect(await realGet('mnemonic')).toBe(storedSeed);
  });

  it('asks for the device passcode when biometrics are unavailable on a secured device', async () => {
    const { auth: authGen1, ui: uiGen1 } = await boot();
    uiGen1.setBiometricLoginEnabled(true);
    await authGen1.setMnemonicAndInitializeAuthentication(VALID_MNEMONIC);

    // E.g. locked out after failed attempts, or no finger enrolled anymore.
    checkBiometryMock.mockResolvedValue({ isAvailable: false, deviceIsSecure: true });
    let unlock;
    openBiometricLoginModalMock.mockImplementation(() => new Promise((resolve) => {
      unlock = resolve;
    }));
    const { auth, ui } = await restart();
    ui.isAppActive.value = true;

    const checking = auth.checkUserAuth();
    await vi.waitFor(
      () => expect(openBiometricLoginModalMock).toHaveBeenCalledTimes(1),
      WAIT_FOR_CRYPTO,
    );
    expect(auth.isAuthenticated.value).toBe(false);
    expect(ui.isBiometricLoginEnabled.value).toBe(true);
    // Not offered to set up as biometrics, only verified with the passcode.
    await expect(auth.checkBiometricLoginAvailability()).resolves.toBe(false);
    await expect(auth.canAuthenticateWithDevice()).resolves.toBe(true);

    unlock();
    await checking;
    expect(auth.isAuthenticated.value).toBe(true);
    expect(ui.isBiometricLoginEnabled.value).toBe(true);

    await auth.authenticateWithBiometry(true);
    expect(biometricAuthenticateMock).toHaveBeenCalledWith(expect.objectContaining({
      allowDeviceCredential: true,
    }));
  });

  it('turns biometric login off and opens the wallet on a device with no passcode', async () => {
    const { auth: authGen1, ui: uiGen1 } = await boot();
    uiGen1.setBiometricLoginEnabled(true);
    await authGen1.setMnemonicAndInitializeAuthentication(VALID_MNEMONIC);

    // Also what the patched Android plugin reports for a device locked only by its SIM.
    checkBiometryMock.mockResolvedValue({ isAvailable: false, deviceIsSecure: false });
    const { auth, ui } = await restart();
    ui.isAppActive.value = true;
    await auth.checkUserAuth();

    expect(openBiometricLoginModalMock).not.toHaveBeenCalled();
    expect(auth.isAuthenticated.value).toBe(true);
    expect(ui.isBiometricLoginEnabled.value).toBe(false);
  });

  describe('when the passcode prompt fails', () => {
    async function restartWithFailingPrompt(code) {
      const { auth: authGen1, ui: uiGen1 } = await boot();
      uiGen1.setBiometricLoginEnabled(true);
      await authGen1.setMnemonicAndInitializeAuthentication(VALID_MNEMONIC);

      checkBiometryMock.mockResolvedValue({ isAvailable: false, deviceIsSecure: true });
      biometricAuthenticateMock.mockRejectedValue(Object.assign(new Error(code), { code }));
      const restarted = await restart();
      // The prompt runs in the modal.
      openBiometricLoginModalMock.mockImplementation(({ force, deferAuthStateUpdate }) => (
        restarted.auth.authenticateWithBiometry(force, { setAuthenticated: !deferAuthStateUpdate })
      ));
      restarted.ui.isAppActive.value = true;
      return restarted;
    }

    it.each([
      ['is cancelled', 'userCancel'],
      ['finds no passcode after all, e.g. one removed meanwhile', 'noDeviceCredential'],
    ])('keeps the wallet locked when it %s', async (_, code) => {
      const { auth, ui } = await restartWithFailingPrompt(code);

      await auth.checkUserAuth();

      expect(biometricAuthenticateMock).toHaveBeenCalledTimes(1);
      expect(auth.isAuthenticated.value).toBe(false);
      expect(ui.isBiometricLoginEnabled.value).toBe(true);
    });

    it('fails a check forced to show a secret, e.g. the seed phrase, in an unlocked wallet', async () => {
      const { auth } = await restartWithFailingPrompt('noDeviceCredential');
      biometricAuthenticateMock.mockResolvedValueOnce(undefined);
      await auth.checkUserAuth();
      expect(auth.isAuthenticated.value).toBe(true);

      await expect(auth.authenticateWithBiometry(true)).rejects.toThrow('noDeviceCredential');
      expect(auth.isAuthenticated.value).toBe(true);
    });
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

  it('asks for the device passcode on resume when the biometrics got locked out meanwhile', async () => {
    const { auth: authGen1, ui: uiGen1 } = await boot();
    uiGen1.setBiometricLoginEnabled(true);
    await authGen1.setMnemonicAndInitializeAuthentication(VALID_MNEMONIC);
    const { auth, ui } = await restart();
    ui.isAppActive.value = true;
    await auth.checkUserAuth();
    expect(openBiometricLoginModalMock).toHaveBeenCalledTimes(1);

    checkBiometryMock.mockResolvedValue({ isAvailable: false, deviceIsSecure: true });
    ui.isAppActive.value = false;
    await nextTick();
    ui.isAppActive.value = true;
    await nextTick();

    await vi.waitFor(
      () => expect(openBiometricLoginModalMock).toHaveBeenCalledTimes(2),
      WAIT_FOR_CRYPTO,
    );
    expect(ui.isBiometricLoginEnabled.value).toBe(true);
  });

  /** Leaves the mnemonic encrypted under a key that is no longer the stored one. */
  async function bootWithMismatchedMobileKey() {
    const { auth: authGen1 } = await boot();
    await authGen1.setMnemonicAndInitializeAuthentication(VALID_MNEMONIC);

    const { SecureMobileStorage } = await import('@/lib/SecureMobileStorage');
    const { STORAGE_KEYS } = await import('@/constants');
    const { encodeBase64 } = await import('@/utils/crypto');
    await SecureMobileStorage.set(
      STORAGE_KEYS.mobileDataKey,
      encodeBase64(globalThis.crypto.getRandomValues(new Uint8Array(32))),
    );

    return restart();
  }

  it('stays locked and offers the wallet reset once when the stored mnemonic cannot be decrypted', async () => {
    let confirmReset;
    openConfirmModalMock.mockImplementation(() => new Promise((resolve) => {
      confirmReset = resolve;
    }));
    const { auth } = await bootWithMismatchedMobileKey();
    const { MODAL_RESET_WALLET } = await import('@/constants');

    await auth.checkUserAuth();
    await auth.checkUserAuth(); // the next navigation

    expect(auth.isAuthenticated.value).toBe(false);
    expect(auth.mnemonicDecrypted.value).toBe('');
    expect(loggerWriteMock).toHaveBeenCalledWith(expect.objectContaining({
      type: 'api-response',
      modal: false,
    }));
    expect(openConfirmModalMock).toHaveBeenCalledTimes(1);
    expect(openConfirmModalMock).toHaveBeenCalledWith(expect.objectContaining({ icon: 'critical' }));

    confirmReset();
    await flushAsync();
    expect(openModalMock).toHaveBeenCalledWith(MODAL_RESET_WALLET);
  });

  it('keeps the stored key when it reads back empty, and unlocks once it reads again', async () => {
    const { auth: authGen1 } = await boot();
    await authGen1.setMnemonicAndInitializeAuthentication(VALID_MNEMONIC);
    const { SecureMobileStorage } = await import('@/lib/SecureMobileStorage');
    const { STORAGE_KEYS } = await import('@/constants');
    const storedKey = await SecureMobileStorage.get(STORAGE_KEYS.mobileDataKey);
    await SecureMobileStorage.remove(STORAGE_KEYS.mobileDataKey);

    const { auth } = await restart();
    await auth.checkUserAuth();

    expect(auth.isAuthenticated.value).toBe(false);
    expect(await SecureMobileStorage.get(STORAGE_KEYS.mobileDataKey)).toBeNull();
    expect(openConfirmModalMock).toHaveBeenCalledWith(expect.objectContaining({
      msg: en.auth.walletKeyUnavailableMessage,
    }));

    await SecureMobileStorage.set(STORAGE_KEYS.mobileDataKey, storedKey);
    const { auth: authAfterRelaunch } = await restart();
    await authAfterRelaunch.checkUserAuth();

    expect(authAfterRelaunch.isAuthenticated.value).toBe(true);
    expect(authAfterRelaunch.mnemonicDecrypted.value).toBe(VALID_MNEMONIC);
  });

  it('does not create a wallet over a stored one whose key reads back empty', async () => {
    const { auth: authGen1 } = await boot();
    await authGen1.setMnemonicAndInitializeAuthentication(VALID_MNEMONIC);
    const { SecureMobileStorage } = await import('@/lib/SecureMobileStorage');
    const { STORAGE_KEYS } = await import('@/constants');
    const storedKey = await SecureMobileStorage.get(STORAGE_KEYS.mobileDataKey);
    await SecureMobileStorage.remove(STORAGE_KEYS.mobileDataKey);

    const { auth } = await restart();
    await auth.checkUserAuth();
    await expect(auth.setMnemonicAndInitializeAuthentication(OTHER_VALID_MNEMONIC))
      .rejects.toMatchObject({ name: 'MobileEncryptionKeyMissingError' });

    await SecureMobileStorage.set(STORAGE_KEYS.mobileDataKey, storedKey);
    const { auth: authAfterRelaunch } = await restart();
    await authAfterRelaunch.checkUserAuth();

    expect(authAfterRelaunch.mnemonicDecrypted.value).toBe(VALID_MNEMONIC);
  });

  it('offers a reload instead of writing a new seed over one that failed to load', async () => {
    const { auth: authGen1 } = await boot();
    await authGen1.setMnemonicAndInitializeAuthentication(VALID_MNEMONIC);
    const { SecureMobileStorage } = await import('@/lib/SecureMobileStorage');
    const { STORAGE_KEYS } = await import('@/constants');
    const storedMnemonic = await SecureMobileStorage.get(STORAGE_KEYS.mnemonic);

    // The seed reads back empty at startup, and can be read again later.
    await SecureMobileStorage.remove(STORAGE_KEYS.mnemonic);
    const { auth } = await restart();
    await vi.waitFor(() => expect(auth.isMnemonicRestored.value).toBe(true), WAIT_FOR_CRYPTO);
    await SecureMobileStorage.set(STORAGE_KEYS.mnemonic, storedMnemonic);

    const originalLocation = window.location;
    const reload = vi.fn();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...originalLocation, reload },
    });
    openConfirmModalMock.mockResolvedValueOnce(undefined);
    try {
      await expect(auth.setMnemonicAndInitializeAuthentication(OTHER_VALID_MNEMONIC))
        .rejects.toMatchObject({ name: 'StoredWalletFoundError' });
      await flushAsync();
      expect(reload).toHaveBeenCalled();
    } finally {
      Object.defineProperty(window, 'location', { configurable: true, value: originalLocation });
    }

    expect(openConfirmModalMock).toHaveBeenCalledWith(expect.objectContaining({
      title: en.auth.storedWalletFoundTitle,
    }));
    expect(await SecureMobileStorage.get(STORAGE_KEYS.mnemonic)).toBe(storedMnemonic);
    const { auth: authAfterReload } = await restart();
    await authAfterReload.checkUserAuth();
    expect(authAfterReload.mnemonicDecrypted.value).toBe(VALID_MNEMONIC);
  });

  it('does not report a wallet as created when its seed fails to save, and saves it on retry', async () => {
    const { auth } = await boot();
    const { SecureMobileStorage } = await import('@/lib/SecureMobileStorage');
    const { STORAGE_KEYS } = await import('@/constants');
    const setItem = SecureMobileStorage.set;
    const setSpy = vi.spyOn(SecureMobileStorage, 'set').mockImplementation((keys, value) => (
      keys === STORAGE_KEYS.mnemonic
        ? Promise.reject(new Error('Keychain write failed'))
        : setItem(keys, value)
    ));

    await expect(auth.setMnemonicAndInitializeAuthentication(VALID_MNEMONIC))
      .rejects.toThrow('Keychain write failed');
    await flushAsync();

    expect(auth.isAuthenticated.value).toBe(false);
    expect(auth.mnemonic.value).toBe('');
    expect(auth.mnemonicDecrypted.value).toBe('');
    expect(await SecureMobileStorage.get(STORAGE_KEYS.mnemonic)).toBeNull();

    setSpy.mockRestore();
    await auth.setMnemonicAndInitializeAuthentication(VALID_MNEMONIC);

    expect(auth.isAuthenticated.value).toBe(true);
    expect(await SecureMobileStorage.get(STORAGE_KEYS.mnemonic)).toBe(auth.mnemonic.value);
    const { auth: authAfterRestart } = await restart();
    await authAfterRestart.checkUserAuth();
    expect(authAfterRestart.mnemonicDecrypted.value).toBe(VALID_MNEMONIC);
  });

  it('replaces a loaded seed when a wallet is imported again', async () => {
    const { auth: authGen1 } = await boot();
    await authGen1.setMnemonicAndInitializeAuthentication(VALID_MNEMONIC);
    await authGen1.setMnemonicAndInitializeAuthentication(OTHER_VALID_MNEMONIC);

    const { auth } = await restart();
    await auth.checkUserAuth();

    expect(openConfirmModalMock).not.toHaveBeenCalled();
    expect(auth.mnemonicDecrypted.value).toBe(OTHER_VALID_MNEMONIC);
  });

  it('offers the wallet reset again on the next auth check after it was dismissed', async () => {
    openConfirmModalMock.mockRejectedValueOnce(new Error('dismissed'));
    const { auth } = await bootWithMismatchedMobileKey();

    await auth.checkUserAuth();
    await flushAsync();
    await auth.checkUserAuth();

    expect(openConfirmModalMock).toHaveBeenCalledTimes(2);
    expect(openModalMock).not.toHaveBeenCalled();
  });
});
