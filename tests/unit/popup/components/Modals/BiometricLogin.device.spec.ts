// @ts-nocheck
import { shallowMount } from '@vue/test-utils';
import { nextTick } from 'vue';

/**
 * The lock screen with the real `useAuth`, so what makes it prompt without a tap is the
 * session, the manual lock and the app being shown, not a mock of the composable.
 */
const VALID_MNEMONIC = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
/** Real WebCrypto runs before these waits, which a loaded CI runner may stretch past 1 s. */
const WAIT_FOR_CRYPTO = { timeout: 5000 };

function flushAsync() {
  return new Promise((resolve) => { setTimeout(resolve, 0); });
}

function biometryError(code) {
  return Object.assign(new Error(code), { code });
}

describe('lock screen on a device', () => {
  let biometricAuthenticateMock;
  let openBiometricLoginModalMock;
  /** The modal opened last. */
  let modal;

  // The modal pulls in the whole `@/composables` barrel. `vi.resetModules` keeps the
  // transforms, so the tests only evaluate it.
  beforeAll(() => import('@/popup/components/Modals/BiometricLogin.vue'), 60000);

  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
    biometricAuthenticateMock = vi.fn().mockResolvedValue(undefined);
    openBiometricLoginModalMock = vi.fn();

    vi.doMock('@aparajita/capacitor-biometric-auth', async (importOriginal) => ({
      ...await importOriginal(),
      BiometricAuth: {
        checkBiometry: vi.fn().mockResolvedValue({ isAvailable: true }),
        authenticate: (...args) => biometricAuthenticateMock(...args),
      },
    }));
    vi.doMock('@/constants', async () => ({
      ...await vi.importActual('@/constants'),
      IS_MOBILE_APP: true,
      IS_EXTENSION: false,
      IS_IOS: false,
      IS_OFFSCREEN_TAB: false,
      RUNNING_IN_TESTS: false,
    }));
    vi.doMock('@/composables/modals', () => ({
      useModals: () => ({
        openBiometricLoginModal: (...args) => openBiometricLoginModalMock(...args),
        openPasswordLoginModal: vi.fn(),
        openEnableBiometricLoginModal: vi.fn(),
        openConfirmModal: vi.fn(() => new Promise(() => {})),
        openModal: vi.fn(),
      }),
    }));
    vi.doMock('@/lib/logger', () => ({
      __esModule: true,
      default: { write: vi.fn() },
    }));
  });

  async function boot() {
    const { useAuth } = await import('@/composables/auth');
    const { useUi } = await import('@/composables/ui');
    const { default: BiometricLogin } = await import('@/popup/components/Modals/BiometricLogin.vue');
    openBiometricLoginModalMock.mockImplementation((props) => new Promise((resolve, reject) => {
      // The modal host drops a modal once it is answered.
      const wrapper = shallowMount(BiometricLogin, {
        props: {
          ...props,
          resolve: (value) => { wrapper.unmount(); resolve(value); },
          reject: (error) => { wrapper.unmount(); reject(error); },
        },
      });
      modal = wrapper;
    }));
    return { auth: useAuth(), ui: useUi() };
  }

  /** A wallet with biometric login on, after an app restart, and still locked. */
  async function bootLockedWallet({ isShown = true } = {}) {
    const { auth: authGen1, ui: uiGen1 } = await boot();
    uiGen1.setBiometricLoginEnabled(true);
    await authGen1.setMnemonicAndInitializeAuthentication(VALID_MNEMONIC);

    vi.resetModules();
    const booted = await boot();
    await flushAsync();
    if (isShown) {
      booted.ui.isAppActive.value = true;
      await nextTick();
    }
    return booted;
  }

  async function hideAndShowApp(ui) {
    const { isAppActive } = ui;
    isAppActive.value = false;
    await nextTick();
    isAppActive.value = true;
    await nextTick();
  }

  /** A lock screen that doesn't prompt waits for a tap, so awaiting it would time out. */
  function waitForPrompts(count) {
    return vi.waitFor(
      () => expect(biometricAuthenticateMock).toHaveBeenCalledTimes(count),
      WAIT_FOR_CRYPTO,
    );
  }

  it('unlocks without a tap as the app starts and when the wallet locked itself on resume', async () => {
    const { auth, ui } = await bootLockedWallet();

    const unlocking = auth.checkUserAuth();
    await waitForPrompts(1);
    await unlocking;
    expect(auth.isAuthenticated.value).toBe(true);

    // Mobile's default timeout is 0 ms, so resuming locks the wallet again.
    await hideAndShowApp(ui);
    await vi.waitFor(() => {
      expect(biometricAuthenticateMock).toHaveBeenCalledTimes(2);
      expect(auth.isAuthenticated.value).toBe(true);
    }, WAIT_FOR_CRYPTO);
  });

  it('waits for the app to be shown before prompting', async () => {
    const { auth, ui } = await bootLockedWallet({ isShown: false });

    const unlocking = auth.checkUserAuth();
    await vi.waitFor(() => expect(openBiometricLoginModalMock).toHaveBeenCalled(), WAIT_FOR_CRYPTO);
    await flushAsync();

    // Android can block a prompt started in the background, and it then never answers.
    expect(biometricAuthenticateMock).not.toHaveBeenCalled();

    ui.isAppActive.value = true;
    await waitForPrompts(1);
    await unlocking;

    expect(auth.isAuthenticated.value).toBe(true);
  });

  it('prompts again when the app is shown again after a cancel', async () => {
    const { auth, ui } = await bootLockedWallet();
    biometricAuthenticateMock.mockRejectedValueOnce(biometryError('userCancel'));

    const unlocking = auth.checkUserAuth();
    await waitForPrompts(1);
    await flushAsync();
    expect(auth.isAuthenticated.value).toBe(false);

    await hideAndShowApp(ui);
    await waitForPrompts(2);
    await unlocking;

    expect(auth.isAuthenticated.value).toBe(true);
  });

  it('waits for the app to be shown again after the user locks the wallet', async () => {
    const { auth, ui } = await bootLockedWallet();
    const unlocking = auth.checkUserAuth();
    await waitForPrompts(1);
    await unlocking;
    // Shown again before the session timed out, so it stays unlocked.
    auth.secureLoginTimeoutDecrypted.value = '60000';
    await vi.waitFor(
      () => expect(auth.secureLoginTimeoutDecrypted.value).toBe('60000'),
      WAIT_FOR_CRYPTO,
    );
    await hideAndShowApp(ui);
    await flushAsync();
    expect(auth.isAuthenticated.value).toBe(true);

    const locking = auth.lockWallet({ isUserInitiated: true });
    await vi.waitFor(() => expect(openBiometricLoginModalMock).toHaveBeenCalledTimes(2));
    await flushAsync();

    // Face ID would unlock it again at once.
    expect(biometricAuthenticateMock).toHaveBeenCalledTimes(1);
    expect(auth.isAuthenticated.value).toBe(false);

    await hideAndShowApp(ui);
    await waitForPrompts(2);
    await locking;

    expect(auth.isAuthenticated.value).toBe(true);
  });

  it('does not prompt again when the prompt itself hid the app', async () => {
    const { auth, ui } = await bootLockedWallet();
    let answerPrompt;
    biometricAuthenticateMock.mockImplementationOnce(() => new Promise((resolve, reject) => {
      answerPrompt = reject;
    }));

    const unlocking = auth.checkUserAuth();
    await vi.waitFor(() => expect(answerPrompt).toBeDefined(), WAIT_FOR_CRYPTO);

    // Android's passcode screen is an activity of its own, it hides the WebView, and the
    // answer arrives before the app is shown again.
    ui.isAppActive.value = false;
    await nextTick();
    answerPrompt(biometryError('userCancel'));
    await flushAsync();
    ui.isAppActive.value = true;
    await flushAsync();

    expect(biometricAuthenticateMock).toHaveBeenCalledTimes(1);
    expect(auth.isAuthenticated.value).toBe(false);

    await modal.trigger('click');
    await waitForPrompts(2);
    await unlocking;

    expect(auth.isAuthenticated.value).toBe(true);
  });

  it('waits for a tap when the prompt of a confirmation hid the app', async () => {
    // Set up in this session, so no lock screen prompted yet.
    const { auth, ui } = await boot();
    ui.setBiometricLoginEnabled(true);
    await auth.setMnemonicAndInitializeAuthentication(VALID_MNEMONIC);
    ui.isAppActive.value = true;
    await nextTick();
    let answerPrompt;
    biometricAuthenticateMock.mockImplementationOnce(() => new Promise((resolve) => {
      answerPrompt = resolve;
    }));

    // Revealing the seed phrase with Android's passcode screen, which hides the app.
    const confirming = openBiometricLoginModalMock({ force: true });
    await modal.trigger('click');
    await vi.waitFor(() => expect(answerPrompt).toBeDefined(), WAIT_FOR_CRYPTO);
    ui.isAppActive.value = false;
    await nextTick();
    answerPrompt();
    await confirming;
    ui.isAppActive.value = true;
    await nextTick();

    // As on resume, which on a device can lock it before the prompt's answer arrives.
    const locking = auth.lockWallet();
    await vi.waitFor(() => expect(openBiometricLoginModalMock).toHaveBeenCalledTimes(2));
    await flushAsync();

    expect(biometricAuthenticateMock).toHaveBeenCalledTimes(1);
    expect(auth.isAuthenticated.value).toBe(false);

    await hideAndShowApp(ui);
    await waitForPrompts(2);
    await locking;

    expect(auth.isAuthenticated.value).toBe(true);
  });
});
