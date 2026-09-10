import { flushPromises, shallowMount } from '@vue/test-utils';
import { ref as mockRef } from 'vue';

const mockGenerateEncryptionKey = vi.fn(async () => 'derived-key');
const mockDecrypt = vi.fn(async () => 'decrypted mnemonic');
const mockOpenBiometricLoginModal = vi.fn();
const mockOpenConfirmModal = vi.fn();

vi.mock('@/constants', async () => ({
  ...(await vi.importActual('@/constants')),
  IS_MOBILE_APP: false,
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
    checkBiometricLoginAvailability: vi.fn(),
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
    isBiometricLoginEnabled: mockRef(false),
  }),
}));

describe('PrivateKeyExport', () => {
  beforeEach(async () => {
    mockGenerateEncryptionKey.mockClear();
    mockDecrypt.mockClear();
    mockOpenBiometricLoginModal.mockReset();
    mockOpenConfirmModal.mockReset();
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
});
