import { shallowMount } from '@vue/test-utils';
import { ref as mockRef } from 'vue';

import { MODAL_RESET_WALLET } from '@/constants';
import Modal from '@/popup/components/Modal.vue';
import BtnMain from '@/popup/components/buttons/BtnMain.vue';
import { RejectedByUserError } from '@/lib/errors';

const mockAuthenticateWithPassword = vi.fn();
const mockGenerateEncryptionKey = vi.fn(async () => 'derived-key');
const mockDecrypt = vi.fn();
const mockResolve = vi.fn();
const mockReject = vi.fn();
const mockAccountsRaw = mockRef([]);
const mockOpenModal = vi.fn();

vi.mock('@/utils', () => ({
  decrypt: mockDecrypt,
  generateEncryptionKey: mockGenerateEncryptionKey,
}));

vi.mock('@/composables', () => ({
  useAccounts: () => ({
    accountsRaw: mockAccountsRaw,
  }),
  useAuth: () => ({
    authenticateWithPassword: mockAuthenticateWithPassword,
    isAuthenticated: mockRef(true),
    encryptionSalt: mockRef('salt'),
    mnemonicEncrypted: mockRef('ciphertext'),
  }),
  useModals: () => ({
    openModal: mockOpenModal,
  }),
}));

describe('PasswordLogin', () => {
  beforeEach(async () => {
    mockAuthenticateWithPassword.mockReset();
    mockGenerateEncryptionKey.mockClear();
    mockDecrypt.mockReset();
    mockResolve.mockClear();
    mockReject.mockClear();
    mockAccountsRaw.value = [{}];
    // The reset dialog resolves also when it is closed
    mockOpenModal.mockReset().mockResolvedValue(undefined);
  });

  async function mountLogin(props = {}) {
    const PasswordLogin = (await import('@/popup/components/Modals/PasswordLogin.vue')).default;
    return shallowMount(PasswordLogin, {
      props: { resolve: mockResolve, reject: mockReject, ...props },
      global: {
        renderStubDefaultSlot: true,
        mocks: { $t: (key) => key },
      },
    });
  }

  it('treats decrypt failures as a wrong password during re-auth', async () => {
    mockDecrypt.mockRejectedValue(new Error('AES-GCM auth tag mismatch'));
    const wrapper = await mountLogin();

    wrapper.vm.password = 'wrong-password';
    await wrapper.vm.login();

    expect(mockGenerateEncryptionKey).toHaveBeenCalledWith('wrong-password', 'salt');
    expect(mockDecrypt).toHaveBeenCalledWith('derived-key', 'ciphertext');
    expect(mockResolve).not.toHaveBeenCalled();
    expect(wrapper.vm.isAuthFailed).toBe(true);
  });

  it('can be closed only when it is cancelable, unlike the lock screen', async () => {
    const lockScreen = await mountLogin();
    lockScreen.findComponent(Modal).vm.$emit('close');
    expect(lockScreen.findComponent(Modal).props('hasCloseButton')).toBe(false);
    expect(mockReject).not.toHaveBeenCalled();

    const prompt = await mountLogin({ isCancelable: true });
    expect(prompt.findComponent(Modal).props('hasCloseButton')).toBe(true);
    prompt.findComponent(Modal).vm.$emit('close');
    expect(mockReject).toHaveBeenCalledWith(expect.any(RejectedByUserError));
    expect(mockResolve).not.toHaveBeenCalled();
  });

  it('asks to confirm, not to unlock, when it can be dismissed', async () => {
    const lockScreen = await mountLogin();
    const prompt = await mountLogin({ isCancelable: true });

    expect(lockScreen.text()).toContain('pages.secureLogin.toUnlock');
    expect(lockScreen.findComponent(BtnMain).props('text')).toBe('pages.secureLogin.login.unlock');
    expect(prompt.text()).not.toContain('pages.secureLogin.toUnlock');
    expect(prompt.findComponent(BtnMain).props('text')).toBe('common.confirm');
  });

  it.each([
    ['opens the wallet', {}, mockResolve],
    ['is dismissed', { isCancelable: true }, mockReject],
  ])('%s after the wallet was reset from it', async (_, props, answer) => {
    mockOpenModal.mockImplementation(async () => { mockAccountsRaw.value = []; });
    const wrapper = await mountLogin(props);

    await wrapper.vm.openForgotPasswordModal();

    expect(mockOpenModal).toHaveBeenCalledWith(MODAL_RESET_WALLET, { isResetPassword: true });
    expect(answer).toHaveBeenCalledTimes(1);
    expect(mockResolve.mock.calls.length + mockReject.mock.calls.length).toBe(1);
  });

  it.each([
    ['the lock screen', {}],
    ['a prompt', { isCancelable: true }],
  ])('keeps %s open when the reset dialog is closed without a reset', async (_, props) => {
    const wrapper = await mountLogin(props);

    await wrapper.vm.openForgotPasswordModal();

    expect(mockResolve).not.toHaveBeenCalled();
    expect(mockReject).not.toHaveBeenCalled();
  });
});
