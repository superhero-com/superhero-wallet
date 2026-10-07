// @ts-nocheck
import { flushPromises, mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import { ref } from 'vue';

import Index from '@/popup/pages/Index.vue';
import {
  useAccounts,
  useAuth,
  useModals,
  useUi,
} from '@/composables';
import {
  MODAL_ACCOUNT_IMPORT,
  MODAL_PROTOCOL_SELECT,
  MODAL_RESET_WALLET,
} from '@/constants';
import en from '@/popup/locales/en-US.json';

vi.mock('@/constants', async (importOriginal) => ({
  ...(await importOriginal()),
  IS_IOS: true,
  IS_MOBILE_APP: true,
}));
vi.mock('@/composables', () => ({
  useAccounts: vi.fn(),
  useAuth: vi.fn(),
  useModals: vi.fn(),
  useUi: vi.fn(),
}));
const routerPush = vi.fn();
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: routerPush }),
}));

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } });

function mountIndex({
  mnemonic = 'stored-ciphertext',
  isAuthenticated = false,
  discoverAccounts = vi.fn().mockResolvedValue(undefined),
  openConfirmModal = vi.fn().mockResolvedValue(undefined),
} = {}) {
  const deps = {
    discoverAccounts,
    openConfirmModal,
    openModal: vi.fn((name) => Promise.resolve(name === MODAL_PROTOCOL_SELECT ? 'aeternity' : undefined)),
    setLoaderVisible: vi.fn(),
    setMnemonicAndInitializeAuthentication: vi.fn().mockResolvedValue(undefined),
  };
  useAccounts.mockReturnValue({
    isLoggedIn: ref(true),
    addRawAccount: vi.fn(),
    discoverAccounts: deps.discoverAccounts,
    setActiveAccountByGlobalIdx: vi.fn(),
  });
  useAuth.mockReturnValue({
    isAuthenticated: ref(isAuthenticated),
    mnemonic: ref(mnemonic),
    generateMnemonic: () => 'new mnemonic',
    setMnemonicAndInitializeAuthentication: deps.setMnemonicAndInitializeAuthentication,
  });
  useModals.mockReturnValue({
    openConfirmModal: deps.openConfirmModal,
    openModal: deps.openModal,
  });
  useUi.mockReturnValue({
    loginTargetLocation: ref({ name: 'account' }),
    setLoaderVisible: deps.setLoaderVisible,
  });

  const wrapper = mount(Index, {
    global: {
      plugins: [i18n],
      stubs: {
        IonPage: { template: '<div><slot /></div>' },
        IonContent: { template: '<div><slot /></div>' },
        RouterLink: true,
        Platforms: true,
      },
    },
  });
  return { wrapper, ...deps };
}

/** Accepts the terms and taps one of the start buttons. */
async function tap(wrapper, button: 'generate-wallet' | 'import-wallet') {
  await wrapper.find('[data-cy=checkbox] input').setValue(true);
  await wrapper.find(`[data-cy=${button}]`).trigger('click');
  await flushPromises();
}

describe('Index page on iOS', () => {
  beforeEach(() => {
    routerPush.mockClear();
  });

  it('does not try to discover accounts for a locked or unreadable wallet', async () => {
    const { discoverAccounts, setLoaderVisible } = mountIndex({ isAuthenticated: false });
    await flushPromises();

    expect(discoverAccounts).not.toHaveBeenCalled();
    expect(setLoaderVisible).not.toHaveBeenCalled();
  });

  it('hides the loader when account discovery fails', async () => {
    const { setLoaderVisible } = mountIndex({
      isAuthenticated: true,
      discoverAccounts: vi.fn().mockRejectedValue(new Error('no seed')),
    });
    await flushPromises();

    expect(setLoaderVisible).toHaveBeenLastCalledWith(false);
    expect(routerPush).not.toHaveBeenCalled();
  });

  it('discovers accounts and continues for an unlocked wallet', async () => {
    const { discoverAccounts, setLoaderVisible } = mountIndex({ isAuthenticated: true });
    await flushPromises();

    expect(discoverAccounts).toHaveBeenCalledTimes(1);
    expect(routerPush).toHaveBeenCalledWith({ name: 'account' });
    expect(setLoaderVisible).toHaveBeenLastCalledWith(false);
  });
});

describe('Index page on mobile with a locked or unreadable wallet stored', () => {
  it('offers to reset it instead of creating a wallet over it', async () => {
    const {
      wrapper, openConfirmModal, openModal, setMnemonicAndInitializeAuthentication,
    } = mountIndex();

    await tap(wrapper, 'generate-wallet');

    expect(openConfirmModal).toHaveBeenCalledWith(expect.objectContaining({
      msg: en.pages.index.replaceWalletMessage,
      icon: 'warning',
    }));
    expect(openModal).toHaveBeenCalledWith(MODAL_RESET_WALLET);
    expect(openModal).not.toHaveBeenCalledWith(MODAL_PROTOCOL_SELECT, expect.anything());
    expect(setMnemonicAndInitializeAuthentication).not.toHaveBeenCalled();
  });

  it('offers to reset it instead of importing a wallet over it', async () => {
    const { wrapper, openModal } = mountIndex();

    await tap(wrapper, 'import-wallet');

    expect(openModal).toHaveBeenCalledWith(MODAL_RESET_WALLET);
    expect(openModal).not.toHaveBeenCalledWith(MODAL_ACCOUNT_IMPORT);
  });

  it('keeps it when the reset is not confirmed', async () => {
    const { wrapper, openModal, setMnemonicAndInitializeAuthentication } = mountIndex({
      openConfirmModal: vi.fn().mockRejectedValue(new Error('cancelled')),
    });

    await tap(wrapper, 'generate-wallet');
    await tap(wrapper, 'import-wallet');

    expect(openModal).not.toHaveBeenCalled();
    expect(setMnemonicAndInitializeAuthentication).not.toHaveBeenCalled();
  });
});

describe('Index page on mobile without a locked wallet', () => {
  it('creates a wallet without asking when none is stored', async () => {
    const {
      wrapper, openConfirmModal, setMnemonicAndInitializeAuthentication,
    } = mountIndex({ mnemonic: '' });

    await tap(wrapper, 'generate-wallet');

    expect(openConfirmModal).not.toHaveBeenCalled();
    expect(setMnemonicAndInitializeAuthentication).toHaveBeenCalledWith('new mnemonic');
  });

  it('imports again without asking when the stored wallet is unlocked', async () => {
    // E.g. a previous import stored the seed, then account discovery failed.
    const { wrapper, openConfirmModal, openModal } = mountIndex({ isAuthenticated: true });

    await tap(wrapper, 'import-wallet');

    expect(openConfirmModal).not.toHaveBeenCalled();
    expect(openModal).toHaveBeenCalledWith(MODAL_ACCOUNT_IMPORT);
  });
});
