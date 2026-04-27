import { shallowMount } from '@vue/test-utils';
import { ref } from 'vue';
import BiometricLogin from '../../../../../src/popup/components/Modals/BiometricLogin.vue';

const mockAuthenticateWithBiometry = jest.fn();
const mockIsAuthenticated = ref(true);

jest.mock('@/composables', () => ({
  useAuth: () => ({
    authenticateWithBiometry: mockAuthenticateWithBiometry,
    isAuthenticated: mockIsAuthenticated,
  }),
}));

describe('BiometricLogin', () => {
  beforeEach(() => {
    mockAuthenticateWithBiometry.mockReset();
    mockIsAuthenticated.value = true;
  });

  it('rejects a forced re-auth modal when the user closes it', async () => {
    const resolve = jest.fn();
    const reject = jest.fn();
    const wrapper = shallowMount(BiometricLogin, {
      props: {
        resolve,
        reject,
        force: true,
      },
    });

    wrapper.vm.handleClose();

    expect(resolve).not.toHaveBeenCalled();
    expect(reject).toHaveBeenCalledTimes(1);
  });

  it('runs biometry for a forced re-auth even when already authenticated', async () => {
    const resolve = jest.fn();
    const reject = jest.fn();
    const wrapper = shallowMount(BiometricLogin, {
      props: {
        resolve,
        reject,
        force: true,
      },
    });

    await wrapper.vm.initAuthenticate();

    expect(mockAuthenticateWithBiometry).toHaveBeenCalledWith(true);
    expect(resolve).toHaveBeenCalledTimes(1);
    expect(reject).not.toHaveBeenCalled();
  });

  it('still allows closing a non-forced modal when already authenticated', async () => {
    const resolve = jest.fn();
    const reject = jest.fn();
    const wrapper = shallowMount(BiometricLogin, {
      props: {
        resolve,
        reject,
      },
    });

    resolve.mockClear();
    wrapper.vm.handleClose();

    expect(resolve).toHaveBeenCalledTimes(1);
    expect(reject).not.toHaveBeenCalled();
  });
});
