// @ts-nocheck
import { flushPromises, mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import { ref } from 'vue';

import SecureLoginSettings from '@/popup/pages/SecureLoginSettings.vue';
import SwitchButton from '@/popup/components/SwitchButton.vue';
import { useAuth, useModals, useUi } from '@/composables';
import en from '@/popup/locales/en-US.json';

vi.mock('@/constants', async (importOriginal) => ({
  ...(await importOriginal()),
  IS_MOBILE_APP: true,
}));
vi.mock('@/composables', () => ({
  useAuth: vi.fn(),
  useModals: vi.fn(),
  useUi: vi.fn(),
}));

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } });

async function mountSettings({ canAuthenticateWithDevice, isBiometricLoginEnabled }) {
  const setBiometricLoginEnabled = vi.fn();
  const openEnableBiometricLoginModal = vi.fn();
  useAuth.mockReturnValue({
    canAuthenticateWithDevice: vi.fn().mockResolvedValue(canAuthenticateWithDevice),
    secureLoginTimeoutDecrypted: ref('0'),
    isUsingDefaultPassword: ref(false),
  });
  useModals.mockReturnValue({
    openEnableBiometricLoginModal,
    openSetPasswordModal: vi.fn(),
  });
  useUi.mockReturnValue({
    isBiometricLoginEnabled: ref(isBiometricLoginEnabled),
    setBiometricLoginEnabled,
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
    openEnableBiometricLoginModal,
    setBiometricLoginEnabled,
  };
}

describe('SecureLoginSettings on mobile', () => {
  it.each([
    ['turned off', true, false],
    ['turned on', false, true],
  ])('lets secure login with only the device passcode be %s, without asking to set up biometrics', async (_, isEnabled, isTurnedOn) => {
    const {
      input,
      openEnableBiometricLoginModal,
      setBiometricLoginEnabled,
    } = await mountSettings({
      canAuthenticateWithDevice: true,
      isBiometricLoginEnabled: isEnabled,
    });

    expect(openEnableBiometricLoginModal).not.toHaveBeenCalled();
    expect(input.attributes('disabled')).toBeUndefined();
    await input.trigger('change');
    expect(setBiometricLoginEnabled).toHaveBeenCalledWith(isTurnedOn);
  });

  it('does not offer it on a device that can not verify the user, and asks to set that up', async () => {
    const {
      input,
      openEnableBiometricLoginModal,
      setBiometricLoginEnabled,
    } = await mountSettings({ canAuthenticateWithDevice: false, isBiometricLoginEnabled: false });

    expect(input.attributes('disabled')).toBeDefined();
    await input.trigger('change');
    expect(setBiometricLoginEnabled).not.toHaveBeenCalled();
    expect(openEnableBiometricLoginModal).toHaveBeenCalled();
  });
});
