import { shallowMount } from '@vue/test-utils';
import { ref as mockRef } from 'vue';

const mockAuthenticateWithPassword = jest.fn();
const mockGenerateEncryptionKey = jest.fn(async () => 'derived-key');
const mockDecrypt = jest.fn();
const mockResolve = jest.fn();

jest.mock('@/utils', () => ({
  decrypt: mockDecrypt,
  generateEncryptionKey: mockGenerateEncryptionKey,
}));

jest.mock('@/composables', () => ({
  useAccounts: () => ({
    accountsRaw: mockRef([]),
  }),
  useAuth: () => ({
    authenticateWithPassword: mockAuthenticateWithPassword,
    isAuthenticated: mockRef(true),
    encryptionSalt: mockRef('salt'),
    mnemonicEncrypted: mockRef('ciphertext'),
  }),
  useModals: () => ({
    openModal: jest.fn(),
  }),
}));

describe('PasswordLogin', () => {
  beforeEach(() => {
    mockAuthenticateWithPassword.mockReset();
    mockGenerateEncryptionKey.mockClear();
    mockDecrypt.mockReset();
    mockResolve.mockClear();
  });

  it('treats decrypt failures as a wrong password during re-auth', async () => {
    mockDecrypt.mockRejectedValue(new Error('AES-GCM auth tag mismatch'));

    // eslint-disable-next-line global-require
    const PasswordLogin = require('@/popup/components/Modals/PasswordLogin.vue').default;
    const wrapper = shallowMount(PasswordLogin, {
      props: {
        resolve: mockResolve,
      },
    });

    wrapper.vm.password = 'wrong-password';
    await wrapper.vm.login();

    expect(mockGenerateEncryptionKey).toHaveBeenCalledWith('wrong-password', 'salt');
    expect(mockDecrypt).toHaveBeenCalledWith('derived-key', 'ciphertext');
    expect(mockResolve).not.toHaveBeenCalled();
    expect(wrapper.vm.isAuthFailed).toBe(true);
  });
});
