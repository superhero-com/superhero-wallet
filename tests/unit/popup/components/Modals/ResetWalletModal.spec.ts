// @ts-nocheck
import { shallowMount } from '@vue/test-utils';

describe('ResetWalletModal', () => {
  const originalBrowser = globalThis.browser;
  const originalLocation = window.location;

  async function mountResetWallet({
    isExtension,
    isMobileApp = false,
    sendMessage = vi.fn(() => Promise.resolve()),
    beforeMount = async () => {},
  }) {
    vi.resetModules();
    vi.doMock('@/constants', async () => ({
      ...(await vi.importActual('@/constants')),
      IS_EXTENSION: isExtension,
      IS_MOBILE_APP: isMobileApp,
    }));
    vi.doMock('vue-router', () => ({ useRouter: () => ({ push: vi.fn() }) }));
    vi.doMock('@/composables', () => ({
      useAccounts: () => ({ resetAccounts: vi.fn() }),
      useAeSdk: () => ({ disconnectDapps: vi.fn() }),
      useModals: () => ({ closeAllModals: vi.fn() }),
      useNetworks: () => ({ resetNetworks: vi.fn() }),
      usePermissions: () => ({ resetPermissions: vi.fn() }),
      useUi: () => ({ resetUiSettings: vi.fn() }),
    }));
    const { default: ResetWalletModal } = await import('@/popup/components/Modals/ResetWalletModal.vue');
    // Set after the import, which re-runs `initPolyfills` and replaces `browser`.
    globalThis.browser = {
      runtime: { sendMessage },
      storage: { local: { clear: vi.fn(() => Promise.resolve()) } },
    };
    await beforeMount();
    return shallowMount(ResetWalletModal, {
      props: { resolve: vi.fn(), reject: vi.fn() },
      global: { mocks: { $t: (key) => key } },
    });
  }

  beforeEach(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...originalLocation, reload: vi.fn() },
    });
  });

  afterEach(() => {
    globalThis.browser = originalBrowser;
    Object.defineProperty(window, 'location', { configurable: true, value: originalLocation });
  });

  it('reloads the offscreen tab in the extension before reloading itself', async () => {
    let offscreenReloaded;
    const sendMessage = vi.fn(() => new Promise((resolve) => { offscreenReloaded = resolve; }));
    const wrapper = await mountResetWallet({ isExtension: true, sendMessage });

    const resetting = wrapper.vm.onReset();
    await vi.waitFor(() => expect(sendMessage).toHaveBeenCalledWith({
      target: 'offscreen',
      method: 'reload',
    }));
    expect(window.location.reload).not.toHaveBeenCalled();

    offscreenReloaded();
    await resetting;
    expect(window.location.reload).toHaveBeenCalled();
  });

  it('still reloads itself when no offscreen tab answers', async () => {
    const sendMessage = vi.fn(() => Promise.reject(new Error('Receiving end does not exist')));
    const wrapper = await mountResetWallet({ isExtension: true, sendMessage });

    await wrapper.vm.onReset();

    expect(window.location.reload).toHaveBeenCalled();
  });

  it('does not message an offscreen tab outside the extension', async () => {
    const wrapper = await mountResetWallet({ isExtension: false });

    await wrapper.vm.onReset();

    expect(globalThis.browser.runtime.sendMessage).not.toHaveBeenCalled();
    expect(window.location.reload).toHaveBeenCalled();
  });

  it('removes the wallet secrets on mobile before reloading, even when the native clear fails', async () => {
    // jsdom's `localStorage.clear()` also wipes the web fallback, so record the native deletes.
    const removedFromKeychain = new Set();
    let removedBeforeReload;
    window.location.reload = vi.fn(() => { removedBeforeReload = new Set(removedFromKeychain); });
    const wrapper = await mountResetWallet({
      isExtension: false,
      isMobileApp: true,
      async beforeMount() {
        const { SecureMobileStorage } = await import('@/lib/SecureMobileStorage');
        vi.spyOn(SecureMobileStorage, 'clear').mockRejectedValue(new Error('delete failed'));
        vi.spyOn(SecureMobileStorage, 'remove').mockImplementation((key) => new Promise((resolve) => {
          setTimeout(() => {
            removedFromKeychain.add(key);
            resolve();
          });
        }));
      },
    });
    const { STORAGE_KEYS } = await import('@/constants');
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    await wrapper.vm.onReset();

    expect(removedBeforeReload).toEqual(new Set([
      STORAGE_KEYS.mnemonic,
      STORAGE_KEYS.mobileDataKey,
      STORAGE_KEYS.privateKeyAccountsRaw,
    ]));
  });
});
