// @ts-nocheck
import { flushPromises, mount, RouterLinkStub } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import { ref } from 'vue';

import More from '@/popup/pages/More.vue';
import {
  useAccounts,
  useAddressBook,
  useAeSdk,
  useAuth,
  useUi,
} from '@/composables';
import { PROTOCOLS } from '@/constants';
import en from '@/popup/locales/en-US.json';

vi.mock('@/constants', async (importOriginal) => ({
  ...(await importOriginal()),
  IS_MOBILE_APP: true,
}));
vi.mock('@/composables', () => ({
  useAccounts: vi.fn(),
  useAddressBook: vi.fn(),
  useAeSdk: vi.fn(),
  useAuth: vi.fn(),
  useUi: vi.fn(),
}));

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } });

async function mountMore({ canAuthenticateWithDevice }) {
  const lockWallet = vi.fn();
  useAccounts.mockReturnValue({ activeAccount: ref({ protocol: PROTOCOLS.aeternity }) });
  useAddressBook.mockReturnValue({ addressBook: ref({}) });
  useAeSdk.mockReturnValue({ isNodeMainnet: ref(false), isNodeTestnet: ref(true) });
  useAuth.mockReturnValue({
    canAuthenticateWithDevice: vi.fn().mockResolvedValue(canAuthenticateWithDevice),
    isMnemonicEncrypted: ref(true),
    isUsingDefaultPassword: ref(false),
    lockWallet,
  });
  useUi.mockReturnValue({ isBiometricLoginEnabled: ref(true) });
  const wrapper = mount(More, {
    global: {
      plugins: [i18n],
      stubs: { PageWrapper: { template: '<div><slot /></div>' }, RouterLink: RouterLinkStub },
    },
  });
  await flushPromises();
  return { lockButton: wrapper.find('[data-cy=lock-wallet]'), lockWallet };
}

describe('More on mobile with biometric login on', () => {
  it('lets a wallet that only the device passcode unlocks be locked', async () => {
    const { lockButton, lockWallet } = await mountMore({ canAuthenticateWithDevice: true });

    await lockButton.trigger('click');
    expect(lockWallet).toHaveBeenCalled();
  });

  it('does not offer the lock when nothing on the device could unlock it again', async () => {
    const { lockButton } = await mountMore({ canAuthenticateWithDevice: false });

    expect(lockButton.exists()).toBe(false);
  });
});
