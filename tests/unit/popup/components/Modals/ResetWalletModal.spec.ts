// @ts-nocheck
import { shallowMount } from '@vue/test-utils';

describe('ResetWalletModal', () => {
  const originalBrowser = globalThis.browser;
  const originalLocation = window.location;

  async function resetWallet({ isExtension }) {
    vi.resetModules();
    vi.doMock('@/constants', async () => ({
      ...(await vi.importActual('@/constants')),
      IS_EXTENSION: isExtension,
      IS_MOBILE_APP: false,
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
      runtime: { sendMessage: vi.fn(() => Promise.resolve()) },
      storage: { local: { clear: vi.fn(() => Promise.resolve()) } },
    };
    const wrapper = shallowMount(ResetWalletModal, {
      props: { resolve: vi.fn(), reject: vi.fn() },
      global: { mocks: { $t: (key) => key } },
    });
    await wrapper.vm.onReset();
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

  it('reloads the offscreen tab in the extension so it drops the old wallet', async () => {
    await resetWallet({ isExtension: true });

    expect(globalThis.browser.runtime.sendMessage).toHaveBeenCalledWith({
      target: 'offscreen',
      method: 'reload',
    });
    expect(window.location.reload).toHaveBeenCalled();
  });

  it('does not message an offscreen tab outside the extension', async () => {
    await resetWallet({ isExtension: false });

    expect(globalThis.browser.runtime.sendMessage).not.toHaveBeenCalled();
    expect(window.location.reload).toHaveBeenCalled();
  });
});
