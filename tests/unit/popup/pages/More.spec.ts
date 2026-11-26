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
import { useInAppBrowser } from '@/composables/inAppBrowser';
import { PROTOCOLS } from '@/constants';
import { AE_DEX_URL } from '@/protocols/aeternity/config';
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
vi.mock('@/composables/inAppBrowser', () => ({ useInAppBrowser: vi.fn() }));

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } });

afterEach(() => {
  vi.restoreAllMocks();
});

async function mountMore({ canAuthenticateWithDevice = false } = {}) {
  const lockWallet = vi.fn();
  const openInAppBrowser = vi.fn();
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
  useInAppBrowser.mockReturnValue({ openInAppBrowser });
  const wrapper = mount(More, {
    global: {
      plugins: [i18n],
      stubs: { PageWrapper: { template: '<div><slot /></div>' }, RouterLink: RouterLinkStub },
    },
  });
  await flushPromises();
  return {
    wrapper,
    lockButton: wrapper.find('[data-cy=lock-wallet]'),
    lockWallet,
    openInAppBrowser,
  };
}

describe('More on mobile with biometric login on', () => {
  it('lets a wallet that only the device passcode unlocks be locked', async () => {
    const { lockButton, lockWallet } = await mountMore({ canAuthenticateWithDevice: true });

    await lockButton.trigger('click');
    // So the lock screen doesn't prompt right away, Face ID would unlock it again.
    expect(lockWallet).toHaveBeenCalledWith({ isUserInitiated: true });
  });

  it('does not offer the lock when nothing on the device could unlock it again', async () => {
    const { lockButton } = await mountMore({ canAuthenticateWithDevice: false });

    expect(lockButton.exists()).toBe(false);
  });
});

describe('More on mobile', () => {
  it('opens the DEX in the in-app browser', async () => {
    const windowOpen = vi.spyOn(window, 'open').mockImplementation(() => null);
    const { wrapper, openInAppBrowser } = await mountMore();

    await wrapper.find('[data-cy=dex]').trigger('click');
    await vi.waitFor(() => expect(openInAppBrowser).toHaveBeenCalledWith(AE_DEX_URL));
    expect(windowOpen).not.toHaveBeenCalled();
  });
});
