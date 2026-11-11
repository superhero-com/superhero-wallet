// @ts-nocheck
import { flushPromises, mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import { ref } from 'vue';
import { defineRule } from 'vee-validate';

import SecureLoginSettings from '@/popup/pages/SecureLoginSettings.vue';
import SwitchButton from '@/popup/components/SwitchButton.vue';
import { useAuth, useModals, useUi } from '@/composables';
import {
  getDefaultPasswordSecret,
  getOrCreateDefaultPasswordSecret,
} from '@/composables/defaultPassword';
import en from '@/popup/locales/en-US.json';

vi.mock('@/constants', async (importOriginal) => ({
  ...(await importOriginal()),
  IS_MOBILE_APP: false,
}));
vi.mock('@/composables', () => ({
  useAuth: vi.fn(),
  useModals: vi.fn(),
  useUi: vi.fn(),
}));
vi.mock('@/composables/defaultPassword', () => ({
  getDefaultPasswordSecret: vi.fn(),
  getOrCreateDefaultPasswordSecret: vi.fn(),
}));

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } });

async function mountSettings(usingDefault = true) {
  const isUsingDefaultPassword = ref(usingDefault);
  const setPassword = vi.fn().mockResolvedValue(undefined);
  const openSetPasswordModal = vi.fn().mockResolvedValue('chosen-password');
  useAuth.mockReturnValue({
    canAuthenticateWithDevice: vi.fn().mockResolvedValue(false),
    secureLoginTimeoutDecrypted: ref('0'),
    isUsingDefaultPassword,
    setPassword,
    updatePassword: vi.fn(),
  });
  useModals.mockReturnValue({
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
    input: wrapper.findComponent(SwitchButton).find('input'),
    isUsingDefaultPassword,
    setPassword,
    openSetPasswordModal,
  };
}

describe('SecureLoginSettings password protection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ['password_min_len', 'passwords_match'].forEach((rule) => defineRule(rule, () => true));
    getDefaultPasswordSecret.mockResolvedValue('old-default-secret');
    getOrCreateDefaultPasswordSecret.mockResolvedValue('next-default-secret');
  });

  it('updates the enabled mode only after the password vault commit succeeds', async () => {
    const state = await mountSettings();
    let completeCommit;
    state.setPassword.mockReturnValue(new Promise((resolve) => { completeCommit = resolve; }));

    await state.input.trigger('change');
    await flushPromises();
    expect(state.setPassword).toHaveBeenCalledWith('chosen-password');
    expect(state.isUsingDefaultPassword.value).toBe(true);
    completeCommit();
    await flushPromises();

    expect(state.isUsingDefaultPassword.value).toBe(false);
  });

  it('keeps default mode when the password dialog is cancelled', async () => {
    const state = await mountSettings();
    state.openSetPasswordModal.mockRejectedValue(new Error('cancelled'));

    await state.input.trigger('change');
    await flushPromises();

    expect(state.setPassword).not.toHaveBeenCalled();
    expect(state.isUsingDefaultPassword.value).toBe(true);
  });

  it('keeps default mode when the password vault cannot be committed', async () => {
    const state = await mountSettings();
    state.setPassword.mockRejectedValue(new Error('storage unavailable'));

    await state.input.trigger('change');
    await flushPromises();

    expect(state.isUsingDefaultPassword.value).toBe(true);
  });

  it('keeps default mode when the selected password is its existing secret', async () => {
    const state = await mountSettings();
    state.openSetPasswordModal.mockResolvedValue('old-default-secret');

    await state.input.trigger('change');
    await flushPromises();

    expect(state.setPassword).toHaveBeenCalledWith('old-default-secret');
    expect(state.isUsingDefaultPassword.value).toBe(true);
  });

  it('disables password protection after the default-secret rotation succeeds', async () => {
    const state = await mountSettings(false);

    await state.input.trigger('change');
    await flushPromises();

    expect(state.setPassword).toHaveBeenCalledWith('next-default-secret');
    expect(state.isUsingDefaultPassword.value).toBe(true);
  });

  it('keeps password protection enabled when default-secret rotation fails', async () => {
    const state = await mountSettings(false);
    state.setPassword.mockRejectedValue(new Error('encryption failed'));

    await state.input.trigger('change');
    await flushPromises();

    expect(state.isUsingDefaultPassword.value).toBe(false);
  });
});
