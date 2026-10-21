import { flushPromises, shallowMount } from '@vue/test-utils';
import { ref as mockRef } from 'vue';

const mockGenerateEncryptionKey = vi.fn(async () => 'derived-key');
const mockDecrypt = vi.fn(async () => 'decrypted mnemonic');
const mockOpenBiometricLoginModal = vi.fn();
const mockOpenConfirmModal = vi.fn();
const mockCanAuthenticateWithDevice = vi.fn();
const mockIsBiometricLoginEnabled = mockRef(false);
const platform = vi.hoisted(() => ({ isMobileApp: false }));

vi.mock('@/constants', async () => ({
  ...(await vi.importActual('@/constants')),
  get IS_MOBILE_APP() { return platform.isMobileApp; },
}));

vi.mock('@/utils', () => ({
  generateEncryptionKey: mockGenerateEncryptionKey,
  decrypt: mockDecrypt,
}));

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key) => key,
  }),
}));

vi.mock('@/composables', () => ({
  useAccounts: () => ({
    activeAccount: mockRef({ secretKey: 'abc123' }),
  }),
  useAuth: () => ({
    canAuthenticateWithDevice: mockCanAuthenticateWithDevice,
    encryptionSalt: mockRef('salt'),
    mnemonicEncrypted: mockRef('ciphertext'),
    isUsingDefaultPassword: mockRef(false),
  }),
  useCopy: () => ({
    copy: vi.fn(),
    copied: mockRef(false),
  }),
  useModals: () => ({
    openBiometricLoginModal: mockOpenBiometricLoginModal,
    openConfirmModal: mockOpenConfirmModal,
  }),
  useUi: () => ({
    isBiometricLoginEnabled: mockIsBiometricLoginEnabled,
  }),
}));

describe('PrivateKeyExport', () => {
  beforeEach(async () => {
    mockGenerateEncryptionKey.mockClear();
    mockDecrypt.mockClear();
    mockOpenBiometricLoginModal.mockReset();
    mockOpenConfirmModal.mockReset();
    mockCanAuthenticateWithDevice.mockReset();
    mockIsBiometricLoginEnabled.value = false;
    platform.isMobileApp = false;
  });

  it('uses password re-auth on mobile web instead of falling back to confirm-only', async () => {
    // eslint-disable-next-line global-require
    const PrivateKeyExport = (await import('../../../../../src/popup/components/Modals/PrivateKeyExport.vue')).default;
    const wrapper = shallowMount(PrivateKeyExport, {
      props: {
        resolve: vi.fn(),
      },
    });

    wrapper.vm.password = 'top-secret';
    wrapper.vm.handleMainButtonClick();
    await flushPromises();

    expect(mockGenerateEncryptionKey).toHaveBeenCalledWith('top-secret', 'salt');
    expect(mockDecrypt).toHaveBeenCalledWith('derived-key', 'ciphertext');
    expect(mockOpenConfirmModal).not.toHaveBeenCalled();
    expect(mockOpenBiometricLoginModal).not.toHaveBeenCalled();
  });

  it('verifies the user on the device on mobile when it can', async () => {
    platform.isMobileApp = true;
    mockIsBiometricLoginEnabled.value = true;
    mockCanAuthenticateWithDevice.mockResolvedValue(true);
    mockOpenBiometricLoginModal.mockResolvedValue(undefined);
    // eslint-disable-next-line global-require
    const PrivateKeyExport = (await import('../../../../../src/popup/components/Modals/PrivateKeyExport.vue')).default;
    const wrapper = shallowMount(PrivateKeyExport, {
      props: {
        resolve: vi.fn(),
      },
    });

    wrapper.vm.handleMainButtonClick();
    await flushPromises();

    expect(mockOpenBiometricLoginModal).toHaveBeenCalledWith({ force: true });
    expect(mockOpenConfirmModal).not.toHaveBeenCalled();
    expect(wrapper.vm.privateKey).toBe(Buffer.from('abc123').toString('hex'));
  });

  it('does not reveal the key on mobile when the device check fails', async () => {
    platform.isMobileApp = true;
    mockIsBiometricLoginEnabled.value = true;
    mockCanAuthenticateWithDevice.mockResolvedValue(true);
    mockOpenBiometricLoginModal.mockRejectedValue(new Error('noDeviceCredential'));
    // eslint-disable-next-line global-require
    const PrivateKeyExport = (await import('../../../../../src/popup/components/Modals/PrivateKeyExport.vue')).default;
    const wrapper = shallowMount(PrivateKeyExport, {
      props: {
        resolve: vi.fn(),
      },
    });

    wrapper.vm.handleMainButtonClick();
    await flushPromises();

    expect(mockOpenConfirmModal).not.toHaveBeenCalled();
    expect(wrapper.vm.privateKey).toBe('');
  });

  it('asks to confirm on mobile when the device can verify the user in no way', async () => {
    platform.isMobileApp = true;
    mockIsBiometricLoginEnabled.value = true;
    mockCanAuthenticateWithDevice.mockResolvedValue(false);
    mockOpenConfirmModal.mockResolvedValue(undefined);
    // eslint-disable-next-line global-require
    const PrivateKeyExport = (await import('../../../../../src/popup/components/Modals/PrivateKeyExport.vue')).default;
    const wrapper = shallowMount(PrivateKeyExport, {
      props: {
        resolve: vi.fn(),
      },
    });

    wrapper.vm.handleMainButtonClick();
    await flushPromises();

    expect(mockOpenConfirmModal).toHaveBeenCalledTimes(1);
    expect(mockOpenBiometricLoginModal).not.toHaveBeenCalled();
    expect(wrapper.vm.privateKey).toBe(Buffer.from('abc123').toString('hex'));
  });
});
