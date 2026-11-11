// @ts-nocheck
import { flushPromises, mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import { ref } from 'vue';
import { defineRule } from 'vee-validate';

import SecureLoginSettings from '@/popup/pages/SecureLoginSettings.vue';
import SwitchButton from '@/popup/components/SwitchButton.vue';
import {
  useAccounts,
  useAuth,
  useModals,
  useUi,
} from '@/composables';
import { generateDefaultPasswordSecret } from '@/composables/defaultPassword';
import {
  discardLegacyCopies,
  VaultConflictError,
  VaultLegacyConflictError,
  VaultSecretUnreadableError,
} from '@/lib/WalletVault';
import { STORAGE_KEYS } from '@/constants';
import { RejectedByUserError, WrongPasswordError } from '@/lib/errors';
import en from '@/popup/locales/en-US.json';

const VAULT_SNAPSHOT = { revision: 'shown-to-the-user', values: {} };
const LEGACY_COPIES = { vault: VAULT_SNAPSHOT, legacy: { mnemonic: 'old-copy' } };

vi.mock('@/constants', async (importOriginal) => ({
  ...(await importOriginal()),
  IS_MOBILE_APP: false,
}));
vi.mock('@/composables', () => ({
  useAccounts: vi.fn(),
  useAuth: vi.fn(),
  useModals: vi.fn(),
  useUi: vi.fn(),
}));
vi.mock('@/composables/defaultPassword', () => ({
  generateDefaultPasswordSecret: vi.fn(),
}));
vi.mock('@/lib/WalletVault', async (importOriginal) => ({
  ...(await importOriginal()),
  discardLegacyCopies: vi.fn(),
}));

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } });

async function mountSettings(usingDefault = true) {
  const isUsingDefaultPassword = ref(usingDefault);
  const setPassword = vi.fn().mockResolvedValue(undefined);
  const updatePassword = vi.fn().mockResolvedValue(undefined);
  const removeUnreadableSecret = vi.fn().mockResolvedValue(undefined);
  const offerToRemoveUnreadablePrivateKeyAccounts = vi.fn();
  const openConfirmModal = vi.fn().mockResolvedValue(undefined);
  const openDefaultModal = vi.fn();
  const openSetPasswordModal = vi.fn().mockResolvedValue({
    password: 'chosen-password',
    isDefaultPasswordSecret: false,
  });
  useAuth.mockReturnValue({
    canAuthenticateWithDevice: vi.fn().mockResolvedValue(false),
    secureLoginTimeoutDecrypted: ref('0'),
    isUsingDefaultPassword,
    removeUnreadableSecret,
    setPassword,
    updatePassword,
  });
  useAccounts.mockReturnValue({ offerToRemoveUnreadablePrivateKeyAccounts });
  useModals.mockReturnValue({
    openConfirmModal,
    openDefaultModal,
    openEnableBiometricLoginModal: vi.fn(),
    openSetPasswordModal,
  });
  useUi.mockReturnValue({
    isBiometricLoginEnabled: ref(false),
    setBiometricLoginEnabled: vi.fn(),
  });
  const wrapper = mount(SecureLoginSettings, {
    global: {
      plugins: [i18n],
      stubs: { PageWrapper: { template: '<div><slot /></div>' } },
    },
  });
  await flushPromises();
  return {
    wrapper,
    input: wrapper.findComponent(SwitchButton).find('input'),
    isUsingDefaultPassword,
    setPassword,
    updatePassword,
    removeUnreadableSecret,
    offerToRemoveUnreadablePrivateKeyAccounts,
    openConfirmModal,
    openDefaultModal,
    openSetPasswordModal,
  };
}

const passwordNotChanged = expect.objectContaining({
  title: en.pages.changePassword.notChangedTitle,
  msg: en.pages.changePassword.failed,
});

describe('SecureLoginSettings password protection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ['password_min_len', 'passwords_match'].forEach((rule) => defineRule(rule, () => true));
    generateDefaultPasswordSecret.mockReturnValue('next-default-secret');
    discardLegacyCopies.mockResolvedValue(undefined);
  });

  it('updates the enabled mode only after the password vault commit succeeds', async () => {
    const state = await mountSettings();
    let completeCommit;
    state.setPassword.mockReturnValue(new Promise((resolve) => { completeCommit = resolve; }));

    await state.input.trigger('change');
    await flushPromises();
    expect(state.setPassword).toHaveBeenCalledWith('chosen-password', undefined, {
      isDefaultPasswordSecret: false,
    });
    expect(state.isUsingDefaultPassword.value).toBe(true);
    completeCommit();
    await flushPromises();

    expect(state.isUsingDefaultPassword.value).toBe(false);
  });

  it('keeps default mode when the password dialog is cancelled', async () => {
    const state = await mountSettings();
    state.openSetPasswordModal.mockRejectedValue(new RejectedByUserError());

    await state.input.trigger('change');
    await flushPromises();

    expect(state.setPassword).not.toHaveBeenCalled();
    expect(state.isUsingDefaultPassword.value).toBe(true);
    expect(state.openDefaultModal).not.toHaveBeenCalled();
  });

  it('keeps default mode, and says so, when the password vault cannot be committed', async () => {
    const state = await mountSettings();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    state.setPassword.mockRejectedValue(new Error('storage unavailable'));

    await state.input.trigger('change');
    await flushPromises();

    expect(state.isUsingDefaultPassword.value).toBe(true);
    expect(state.openDefaultModal).toHaveBeenCalledWith(passwordNotChanged);
  });

  it('offers to remove data that blocks turning the password protection on', async () => {
    const state = await mountSettings();
    state.setPassword.mockRejectedValue(
      new VaultSecretUnreadableError(STORAGE_KEYS.invitesEncrypted, VAULT_SNAPSHOT),
    );

    await state.input.trigger('change');
    await flushPromises();

    expect(state.isUsingDefaultPassword.value).toBe(true);
    expect(state.openConfirmModal).toHaveBeenCalledWith(expect.objectContaining({
      title: en.pages.changePassword.notChangedTitle,
      msg: expect.stringContaining(en.pages.changePassword.unreadableData.invites),
    }));
    expect(state.removeUnreadableSecret)
      .toHaveBeenCalledWith(STORAGE_KEYS.invitesEncrypted, VAULT_SNAPSHOT);
    expect(state.openDefaultModal).not.toHaveBeenCalled();
  });

  it('stays in default mode when the dialog is skipped, storing the new secret with its intent', async () => {
    const state = await mountSettings();
    state.openSetPasswordModal.mockResolvedValue({
      password: 'skipped-secret',
      isDefaultPasswordSecret: true,
    });

    await state.input.trigger('change');
    await flushPromises();

    expect(state.setPassword).toHaveBeenCalledWith('skipped-secret', undefined, {
      isDefaultPasswordSecret: true,
    });
    expect(state.isUsingDefaultPassword.value).toBe(true);
  });

  it('disables password protection with a new secret stored in the same commit', async () => {
    const state = await mountSettings(false);

    await state.input.trigger('change');
    await flushPromises();

    expect(state.setPassword).toHaveBeenCalledWith('next-default-secret', undefined, {
      isDefaultPasswordSecret: true,
    });
    expect(state.isUsingDefaultPassword.value).toBe(true);
  });

  it('changes the protection once when the switch is clicked again while it is saved', async () => {
    const state = await mountSettings(false);
    let completeCommit;
    state.setPassword.mockReturnValue(new Promise((resolve) => { completeCommit = resolve; }));

    await state.input.trigger('change');
    await flushPromises();
    expect(state.input.attributes('disabled')).toBeDefined();
    await state.input.trigger('change');
    await flushPromises();
    completeCommit();
    await flushPromises();

    expect(state.setPassword).toHaveBeenCalledTimes(1);
    expect(state.isUsingDefaultPassword.value).toBe(true);
    expect(state.openDefaultModal).not.toHaveBeenCalled();
    expect(state.input.attributes('disabled')).toBeUndefined();
  });

  it('keeps password protection enabled when default-secret rotation fails', async () => {
    const state = await mountSettings(false);
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    state.setPassword.mockRejectedValue(new Error('encryption failed'));

    await state.input.trigger('change');
    await flushPromises();

    expect(state.isUsingDefaultPassword.value).toBe(false);
    expect(state.openDefaultModal).toHaveBeenCalledWith(passwordNotChanged);
  });

  describe('a change refused for data that blocks it', () => {
    async function changePassword(state) {
      await state.wrapper.find('[data-cy=current-password] input').setValue('current-password');
      await state.wrapper.find('[data-cy=new-password] input').setValue('new-password');
      await state.wrapper.find('[data-cy=confirm-new-password] input').setValue('new-password');
      await state.wrapper.find('form').trigger('submit');
      await flushPromises();
    }

    it('names unreadable invites instead of a wrong password, and removes them only on request', async () => {
      const state = await mountSettings(false);
      state.updatePassword.mockRejectedValue(
        new VaultSecretUnreadableError(STORAGE_KEYS.invitesEncrypted, VAULT_SNAPSHOT),
      );

      await changePassword(state);

      expect(state.wrapper.text()).not.toContain(en.pages.secureLogin.login.error);
      expect(state.openConfirmModal).toHaveBeenCalledWith(expect.objectContaining({
        msg: expect.stringContaining(en.pages.changePassword.unreadableData.invites),
      }));
      // Bound to the vault the error was raised for, not to whatever is stored when confirmed.
      expect(state.removeUnreadableSecret)
        .toHaveBeenCalledWith(STORAGE_KEYS.invitesEncrypted, VAULT_SNAPSHOT);
    });

    it('keeps unreadable data when its removal is dismissed', async () => {
      const state = await mountSettings(false);
      state.openConfirmModal.mockRejectedValue(new RejectedByUserError());
      state.updatePassword.mockRejectedValue(
        new VaultSecretUnreadableError(STORAGE_KEYS.secureLoginTimeout, VAULT_SNAPSHOT),
      );

      await changePassword(state);

      expect(state.openConfirmModal).toHaveBeenCalled();
      expect(state.removeUnreadableSecret).not.toHaveBeenCalled();
    });

    it('offers the removal of imported accounts that can be imported again, saying the password was not changed', async () => {
      const state = await mountSettings(false);
      state.updatePassword.mockRejectedValue(
        new VaultSecretUnreadableError(STORAGE_KEYS.privateKeyAccountsRaw, VAULT_SNAPSHOT),
      );

      await changePassword(state);

      expect(state.offerToRemoveUnreadablePrivateKeyAccounts).toHaveBeenCalledWith({
        title: en.pages.changePassword.notChangedTitle,
        msg: expect.stringContaining(en.pages.changePassword.unreadableData.privateKeyAccounts),
      });
      expect(state.removeUnreadableSecret).not.toHaveBeenCalled();
      expect(state.wrapper.text()).not.toContain(en.pages.secureLogin.login.error);
    });

    it('asks before discarding the copies of an older wallet version', async () => {
      const state = await mountSettings(false);
      state.updatePassword.mockRejectedValue(new VaultLegacyConflictError(LEGACY_COPIES));

      await changePassword(state);

      expect(state.openConfirmModal).toHaveBeenCalledWith(expect.objectContaining({
        msg: en.pages.changePassword.legacyCopiesMsg,
      }));
      expect(discardLegacyCopies).toHaveBeenCalledWith(LEGACY_COPIES);
    });

    it('says the password was not changed when removing the data fails', async () => {
      const state = await mountSettings(false);
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      state.updatePassword.mockRejectedValue(
        new VaultSecretUnreadableError(STORAGE_KEYS.invitesEncrypted, VAULT_SNAPSHOT),
      );
      // E.g. another window stored a change while the dialog was open.
      state.removeUnreadableSecret.mockRejectedValue(new VaultConflictError());

      await changePassword(state);

      expect(state.openDefaultModal).toHaveBeenCalledWith(passwordNotChanged);
    });

    it('says the password was not changed when discarding the older copies fails', async () => {
      const state = await mountSettings(false);
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      state.updatePassword.mockRejectedValue(new VaultLegacyConflictError(LEGACY_COPIES));
      discardLegacyCopies.mockRejectedValue(new VaultConflictError());

      await changePassword(state);

      expect(state.openDefaultModal).toHaveBeenCalledWith(passwordNotChanged);
    });

    it('still reports a wrong current password as such', async () => {
      const state = await mountSettings(false);
      state.updatePassword.mockRejectedValue(new WrongPasswordError());

      await changePassword(state);

      expect(state.wrapper.text()).toContain(en.pages.secureLogin.login.error);
      expect(state.openConfirmModal).not.toHaveBeenCalled();
      expect(state.openDefaultModal).not.toHaveBeenCalled();
    });

    it('says the password was not changed, not that it was wrong, when saving it failed', async () => {
      const state = await mountSettings(false);
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      // E.g. another window stored a change meanwhile.
      state.updatePassword.mockRejectedValue(new VaultConflictError());

      await changePassword(state);

      expect(state.wrapper.text()).not.toContain(en.pages.secureLogin.login.error);
      expect(state.openDefaultModal).toHaveBeenCalledWith(passwordNotChanged);
    });
  });
});
