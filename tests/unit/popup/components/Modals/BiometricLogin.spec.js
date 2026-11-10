import { enableAutoUnmount, shallowMount } from '@vue/test-utils';
import { nextTick, ref } from 'vue';
import BiometricLogin from '../../../../../src/popup/components/Modals/BiometricLogin.vue';

// Mounted modals would keep watching the shared `isAppActive` across tests.
enableAutoUnmount(afterEach);

const mockAuthenticateWithBiometry = vi.fn();
const mockClaimLockScreenAutoPrompt = vi.fn();
const mockIsAuthenticated = ref(true);
const mockIsAppActive = ref(true);

vi.mock('@/composables', () => ({
  useAuth: () => ({
    authenticateWithBiometry: mockAuthenticateWithBiometry,
    claimLockScreenAutoPrompt: mockClaimLockScreenAutoPrompt,
    isAuthenticated: mockIsAuthenticated,
  }),
  useUi: () => ({
    isAppActive: mockIsAppActive,
  }),
}));

function flushAsync() {
  return new Promise((resolve) => { setTimeout(resolve, 0); });
}

function mountLogin(props = {}) {
  const resolve = vi.fn();
  const reject = vi.fn();
  const wrapper = shallowMount(BiometricLogin, {
    props: { resolve, reject, ...props },
    global: {
      renderStubDefaultSlot: true,
      mocks: { $t: (key) => key },
    },
  });
  return { wrapper, resolve, reject };
}

function getTitle(wrapper) {
  return wrapper.find('.title').text();
}

function biometryError(code) {
  return Object.assign(new Error(code), { code });
}

describe('BiometricLogin', () => {
  beforeEach(() => {
    mockAuthenticateWithBiometry.mockReset();
    mockClaimLockScreenAutoPrompt.mockReset().mockReturnValue(false);
    mockIsAuthenticated.value = true;
    mockIsAppActive.value = true;
  });

  it('rejects a forced re-auth modal when the user closes it', async () => {
    const { wrapper, resolve, reject } = mountLogin({ force: true });

    wrapper.vm.handleClose();

    expect(resolve).not.toHaveBeenCalled();
    expect(reject).toHaveBeenCalledTimes(1);
  });

  it('runs biometry for a forced re-auth even when already authenticated', async () => {
    const { wrapper, resolve, reject } = mountLogin({ force: true });

    await wrapper.vm.initAuthenticate();

    expect(mockAuthenticateWithBiometry).toHaveBeenCalledWith(true, { setAuthenticated: true });
    expect(resolve).toHaveBeenCalledTimes(1);
    expect(reject).not.toHaveBeenCalled();
  });

  it('can defer the authenticated state update to the caller', async () => {
    const { wrapper, resolve, reject } = mountLogin({ force: true, deferAuthStateUpdate: true });

    await wrapper.vm.initAuthenticate();

    expect(mockAuthenticateWithBiometry).toHaveBeenCalledWith(true, { setAuthenticated: false });
    expect(resolve).toHaveBeenCalledTimes(1);
    expect(reject).not.toHaveBeenCalled();
  });

  it('still allows closing a non-forced modal when already authenticated', async () => {
    const { wrapper, resolve, reject } = mountLogin();

    resolve.mockClear();
    wrapper.vm.handleClose();

    expect(resolve).toHaveBeenCalledTimes(1);
    expect(reject).not.toHaveBeenCalled();
  });

  describe('prompting without a tap', () => {
    beforeEach(() => {
      mockIsAuthenticated.value = false;
    });

    it('prompts on the lock screen as soon as it opens', async () => {
      mockClaimLockScreenAutoPrompt.mockReturnValue(true);
      const { resolve } = mountLogin({
        force: true,
        deferAuthStateUpdate: true,
        isLockScreen: true,
      });
      await flushAsync();

      expect(mockAuthenticateWithBiometry).toHaveBeenCalledTimes(1);
      expect(mockAuthenticateWithBiometry).toHaveBeenCalledWith(true, { setAuthenticated: false });
      expect(resolve).toHaveBeenCalledTimes(1);
    });

    it('waits for a tap on a confirmation, also when the app is shown again', async () => {
      mockClaimLockScreenAutoPrompt.mockReturnValue(true);
      mockIsAuthenticated.value = true;
      const { wrapper, resolve } = mountLogin({ force: true });
      await flushAsync();

      mockIsAppActive.value = false;
      await nextTick();
      mockIsAppActive.value = true;
      await flushAsync();

      expect(mockAuthenticateWithBiometry).not.toHaveBeenCalled();
      // The turn is shared, a confirmation using it up would leave the lock screen waiting.
      expect(mockClaimLockScreenAutoPrompt).not.toHaveBeenCalled();

      await wrapper.trigger('click');
      await flushAsync();

      expect(mockAuthenticateWithBiometry).toHaveBeenCalledTimes(1);
      expect(resolve).toHaveBeenCalledTimes(1);
    });

    it('waits for a tap when it may not prompt by itself', async () => {
      const { wrapper, resolve } = mountLogin({ isLockScreen: true });
      await flushAsync();

      expect(mockAuthenticateWithBiometry).not.toHaveBeenCalled();

      await wrapper.trigger('click');
      await flushAsync();

      expect(mockAuthenticateWithBiometry).toHaveBeenCalledTimes(1);
      expect(resolve).toHaveBeenCalledTimes(1);
    });

    it('prompts on the lock screen when the app is shown again', async () => {
      mountLogin({ isLockScreen: true });
      await flushAsync();
      expect(mockAuthenticateWithBiometry).not.toHaveBeenCalled();

      mockIsAppActive.value = false;
      await nextTick();
      mockClaimLockScreenAutoPrompt.mockReturnValue(true);
      mockIsAppActive.value = true;
      await flushAsync();

      expect(mockAuthenticateWithBiometry).toHaveBeenCalledTimes(1);
    });

    it('ignores a tap while it prompts by itself', async () => {
      mockClaimLockScreenAutoPrompt.mockReturnValueOnce(true);
      let answerPrompt;
      mockAuthenticateWithBiometry.mockImplementationOnce(() => new Promise((resolve) => {
        answerPrompt = resolve;
      }));
      const { wrapper, resolve } = mountLogin({ isLockScreen: true });
      await flushAsync();

      // Users used to tapping the lock screen still do as it opens.
      await wrapper.trigger('click');
      await flushAsync();
      expect(mockAuthenticateWithBiometry).toHaveBeenCalledTimes(1);

      answerPrompt();
      await flushAsync();
      expect(resolve).toHaveBeenCalledTimes(1);
    });

    it('reports a failure only for a prompt the user tapped for', async () => {
      mockClaimLockScreenAutoPrompt.mockReturnValueOnce(true);
      mockAuthenticateWithBiometry
        .mockRejectedValueOnce(biometryError('userCancel'))
        .mockRejectedValueOnce(biometryError('userCancel'));
      const { wrapper, resolve } = mountLogin({ isLockScreen: true });
      await flushAsync();

      // The system closes prompts as a cancel too, e.g. as the app leaves on Android 11+.
      expect(mockAuthenticateWithBiometry).toHaveBeenCalledTimes(1);
      expect(getTitle(wrapper)).toBe('pages.secureLogin.walletLocked');

      await wrapper.trigger('click');
      await flushAsync();

      expect(getTitle(wrapper)).toBe('pages.secureLogin.authFailed');

      await wrapper.trigger('click');
      await flushAsync();

      expect(mockAuthenticateWithBiometry).toHaveBeenCalledTimes(3);
      expect(resolve).toHaveBeenCalledTimes(1);
    });
  });
});
