import { flushPromises, shallowMount } from '@vue/test-utils';
import { ref as mockRef } from 'vue';
import { PROTOCOLS } from '@/constants';

const mockActiveAccount = mockRef();
const mockCopy = vi.fn();
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
    activeAccount: mockActiveAccount,
  }),
  useAuth: () => ({
    canAuthenticateWithDevice: mockCanAuthenticateWithDevice,
    encryptionSalt: mockRef('salt'),
    mnemonicEncrypted: mockRef('ciphertext'),
    isUsingDefaultPassword: mockRef(false),
  }),
  useCopy: () => ({
    copy: mockCopy,
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
    mockActiveAccount.value = { protocol: PROTOCOLS.ethereum, secretKey: 'abc123' };
    mockCopy.mockClear();
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

  describe('formats', () => {
    const SEED_HEX = '9d61b19deffd5a60ba844af492ec2cc44449c5697b326919703bac031cae7f60';
    const SECRET_KEY = 'sk_2CK6vgUFHBTWVA9bMakzaB94Fhjuhwi4K6zQWU7tU8nKQ14rhM';

    async function reveal() {
      const PrivateKeyExport = (await import('../../../../../src/popup/components/Modals/PrivateKeyExport.vue')).default;
      const wrapper = shallowMount(PrivateKeyExport, {
        props: { resolve: vi.fn() },
        global: {
          renderStubDefaultSlot: true,
          mocks: { $t: (key) => key },
          stubs: { DetailsItem: { template: '<div><slot name="value" /></div>' } },
        },
      });
      wrapper.vm.password = 'top-secret';
      wrapper.vm.handleMainButtonClick();
      await flushPromises();
      return wrapper;
    }

    function getShownKey(wrapper) {
      return wrapper.find('[data-cy=copy]').attributes('value');
    }

    it('shows an æternity key in hex, and as sk_ when picked', async () => {
      mockActiveAccount.value = {
        protocol: PROTOCOLS.aeternity,
        secretKey: Buffer.from(SEED_HEX, 'hex'),
      };
      const wrapper = await reveal();

      expect(getShownKey(wrapper)).toBe(SEED_HEX);
      expect(wrapper.find('[data-cy=format-hex]').attributes('aria-pressed')).toBe('true');

      await wrapper.find('[data-cy=format-sk]').trigger('click');
      expect(getShownKey(wrapper)).toBe(SECRET_KEY);
      expect(wrapper.find('[data-cy=format-sk]').attributes('aria-pressed')).toBe('true');
      expect(mockDecrypt).toHaveBeenCalledTimes(1);

      await wrapper.find('[data-cy=copy]').trigger('click');
      expect(mockCopy).toHaveBeenCalledWith(SECRET_KEY);
    });

    it('keeps the key it revealed when the account changes', async () => {
      mockActiveAccount.value = {
        protocol: PROTOCOLS.aeternity,
        secretKey: Buffer.from(SEED_HEX, 'hex'),
      };
      const wrapper = await reveal();

      mockActiveAccount.value = { protocol: PROTOCOLS.ethereum, secretKey: 'abc123' };
      await flushPromises();

      expect(getShownKey(wrapper)).toBe(SEED_HEX);
    });

    it('offers no choice for a protocol with one format', async () => {
      const wrapper = await reveal();

      expect(getShownKey(wrapper)).toBe(Buffer.from('abc123').toString('hex'));
      expect(wrapper.find('[data-cy=format-hex]').exists()).toBe(false);
    });
  });
});
