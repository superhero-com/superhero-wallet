import { flushPromises, shallowMount } from '@vue/test-utils';
import { ref as mockRef } from 'vue';

const mockGenerateEncryptionKey = jest.fn(async () => 'derived-key');
const mockDecrypt = jest.fn(async () => 'decrypted mnemonic');
const mockOpenBiometricLoginModal = jest.fn();
const mockOpenConfirmModal = jest.fn();

jest.mock('@/constants', () => ({
  ...jest.requireActual('@/constants'),
  IS_MOBILE_APP: false,
}));

jest.mock('@/utils', () => ({
  generateEncryptionKey: mockGenerateEncryptionKey,
  decrypt: mockDecrypt,
}));

jest.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key) => key,
  }),
}));

jest.mock('@/composables', () => ({
  useAccounts: () => ({
    activeAccount: mockRef({ secretKey: 'abc123' }),
  }),
  useAuth: () => ({
    checkBiometricLoginAvailability: jest.fn(),
    encryptionSalt: mockRef('salt'),
    mnemonicEncrypted: mockRef('ciphertext'),
    isUsingDefaultPassword: mockRef(false),
  }),
  useCopy: () => ({
    copy: jest.fn(),
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
  beforeEach(() => {
    mockGenerateEncryptionKey.mockClear();
    mockDecrypt.mockClear();
    mockOpenBiometricLoginModal.mockReset();
    mockOpenConfirmModal.mockReset();
  });

  it('uses password re-auth on mobile web instead of falling back to confirm-only', async () => {
    // eslint-disable-next-line global-require
    const PrivateKeyExport = require('../../../../../src/popup/components/Modals/PrivateKeyExport.vue').default;
    const wrapper = shallowMount(PrivateKeyExport, {
      props: {
        resolve: jest.fn(),
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
