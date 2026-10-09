// @ts-nocheck
import { flushPromises, mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import { computed, ref } from 'vue';

import Index from '@/popup/pages/Index.vue';
import {
  useAccounts,
  useAuth,
  useModals,
  useNotifications,
  useUi,
} from '@/composables';
import {
  ACCOUNT_TYPES,
  MODAL_ACCOUNT_IMPORT,
  MODAL_PROTOCOL_SELECT,
  MODAL_RESET_WALLET,
  PROTOCOLS,
} from '@/constants';
import { StoredWalletFoundError } from '@/lib/errors';
import { ROUTE_INDEX } from '@/popup/router/routeNames';
import en from '@/popup/locales/en-US.json';

const platform = vi.hoisted(() => ({ isMobileApp: true }));
vi.mock('@/constants', async (importOriginal) => ({
  ...(await importOriginal()),
  // Not iOS: stored wallets are opened on every platform.
  IS_IOS: false,
  get IS_MOBILE_APP() { return platform.isMobileApp; },
}));
vi.mock('@/composables', () => ({
  useAccounts: vi.fn(),
  useAuth: vi.fn(),
  useModals: vi.fn(),
  useNotifications: vi.fn(),
  useUi: vi.fn(),
}));
const routerPush = vi.fn();
const currentRoute = ref({ name: ROUTE_INDEX });
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: routerPush, currentRoute }),
}));

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } });
const FOUND_ACCOUNT = {
  isRestored: true,
  protocol: PROTOCOLS.ethereum,
  type: ACCOUNT_TYPES.hdWallet,
};
const FALLBACK_ACCOUNT = {
  isRestored: true,
  protocol: PROTOCOLS.aeternity,
  type: ACCOUNT_TYPES.hdWallet,
};

function mountIndex({
  mnemonic = 'stored-ciphertext',
  isAuthenticated = false,
  activeIdx = 0,
  discoverAccounts = undefined,
  openConfirmModal = vi.fn().mockResolvedValue(undefined),
  openModal = undefined,
  setMnemonicAndInitializeAuthentication = undefined,
} = {}) {
  const state = {
    accountsRaw: ref([]),
    activeIdx: ref(activeIdx),
    isAuthenticated: ref(isAuthenticated),
    mnemonic: ref(mnemonic),
  };
  // Like the real ones: a locked seed derives no accounts, and being logged in
  // means the active index points at one of them.
  const accounts = computed(() => (state.isAuthenticated.value ? state.accountsRaw.value : []));
  const addRawAccount = vi.fn((account) => state.accountsRaw.value.push(account));
  const deps = {
    addRawAccount,
    addWalletNotification: vi.fn(),
    discoverAccounts: discoverAccounts ?? vi.fn(async () => {
      addRawAccount(FOUND_ACCOUNT);
      return true;
    }),
    openConfirmModal,
    openDefaultModal: vi.fn().mockResolvedValue(undefined),
    openModal: openModal ?? vi.fn((name) => Promise.resolve(
      name === MODAL_PROTOCOL_SELECT ? PROTOCOLS.aeternity : undefined,
    )),
    setActiveAccountByGlobalIdx: vi.fn((idx) => { state.activeIdx.value = idx; }),
    // Like the real one: the new seed is stored and unlocked.
    setMnemonicAndInitializeAuthentication: setMnemonicAndInitializeAuthentication
      ?? vi.fn(async () => {
        state.mnemonic.value = 'new-ciphertext';
        state.isAuthenticated.value = true;
      }),
  };
  useAccounts.mockReturnValue({
    accounts,
    accountsRaw: state.accountsRaw,
    isLoggedIn: computed(() => !!accounts.value[state.activeIdx.value]),
    addRawAccount: deps.addRawAccount,
    discoverAccounts: deps.discoverAccounts,
    setActiveAccountByGlobalIdx: deps.setActiveAccountByGlobalIdx,
  });
  useAuth.mockReturnValue({
    isAuthenticated: state.isAuthenticated,
    mnemonic: state.mnemonic,
    generateMnemonic: () => 'new mnemonic',
    setMnemonicAndInitializeAuthentication: deps.setMnemonicAndInitializeAuthentication,
  });
  useModals.mockReturnValue({
    openConfirmModal: deps.openConfirmModal,
    openDefaultModal: deps.openDefaultModal,
    openModal: deps.openModal,
  });
  useNotifications.mockReturnValue({ addWalletNotification: deps.addWalletNotification });
  useUi.mockReturnValue({ loginTargetLocation: ref({ name: 'account' }) });

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
  return { wrapper, ...state, ...deps };
}

/** Accepts the terms and taps one of the start buttons. */
async function tap(wrapper, button: 'generate-wallet' | 'import-wallet') {
  await wrapper.find('[data-cy=checkbox] input').setValue(true);
  await wrapper.find(`[data-cy=${button}]`).trigger('click');
  await flushPromises();
}

/** A discovery that finishes only when the returned function is called. */
function pendingDiscovery() {
  let finish;
  const discoverAccounts = vi.fn(() => new Promise((resolve) => { finish = resolve; }));
  return { discoverAccounts, finish: (isComplete = true) => finish(isComplete) };
}

beforeEach(() => {
  routerPush.mockClear();
  currentRoute.value = { name: ROUTE_INDEX };
  platform.isMobileApp = true;
});

describe('Index page with an unlocked wallet stored and no accounts', () => {
  it('restores its accounts and opens it', async () => {
    const {
      discoverAccounts, accountsRaw, addWalletNotification, setActiveAccountByGlobalIdx,
    } = mountIndex({ isAuthenticated: true });
    await flushPromises();

    expect(discoverAccounts).toHaveBeenCalledWith({ timeout: expect.any(Number) });
    expect(accountsRaw.value).toEqual([FOUND_ACCOUNT]);
    expect(addWalletNotification).not.toHaveBeenCalled();
    expect(setActiveAccountByGlobalIdx).not.toHaveBeenCalled();
    expect(routerPush).toHaveBeenCalledWith({ name: 'account' });
  });

  it('activates the first account when the stored active index points past the restored ones', async () => {
    const { setActiveAccountByGlobalIdx } = mountIndex({ isAuthenticated: true, activeIdx: 3 });
    await flushPromises();

    expect(setActiveAccountByGlobalIdx).toHaveBeenCalledWith(0);
    expect(routerPush).toHaveBeenCalledWith({ name: 'account' });
  });

  it('shows the restoring state instead of the start buttons meanwhile', async () => {
    const { discoverAccounts, finish } = pendingDiscovery();
    const { wrapper } = mountIndex({ isAuthenticated: true, discoverAccounts });
    await flushPromises();

    expect(wrapper.find('[data-cy=restoring-accounts]').text()).toContain(en.pages.index.restoringAccounts);
    expect(wrapper.find('[data-cy=checkbox]').exists()).toBe(false);

    finish();
    await flushPromises();
    expect(wrapper.find('[data-cy=restoring-accounts]').exists()).toBe(false);
  });

  it('opens the first æternity account when nothing is found and no chain is chosen', async () => {
    const { accountsRaw, addWalletNotification } = mountIndex({
      isAuthenticated: true,
      discoverAccounts: vi.fn().mockResolvedValue(true),
    });
    await flushPromises();

    expect(accountsRaw.value).toEqual([FALLBACK_ACCOUNT]);
    expect(addWalletNotification).not.toHaveBeenCalled();
    expect(routerPush).toHaveBeenCalledWith({ name: 'account' });
  });

  it('opens the first æternity account and says some may be missing when it times out', async () => {
    const { accountsRaw, addWalletNotification } = mountIndex({
      isAuthenticated: true,
      discoverAccounts: vi.fn().mockResolvedValue(false),
    });
    await flushPromises();

    expect(accountsRaw.value).toEqual([FALLBACK_ACCOUNT]);
    expect(addWalletNotification).toHaveBeenCalledWith({
      title: en.pages.index.restoreIncompleteTitle,
      text: en.pages.index.restoreIncompleteText,
    });
    expect(routerPush).toHaveBeenCalledWith({ name: 'account' });
  });

  it('opens the first æternity account and says some may be missing when the discovery fails', async () => {
    const { accountsRaw, addWalletNotification } = mountIndex({
      isAuthenticated: true,
      discoverAccounts: vi.fn().mockRejectedValue(new Error('offline')),
    });
    await flushPromises();

    expect(accountsRaw.value).toEqual([FALLBACK_ACCOUNT]);
    expect(addWalletNotification).toHaveBeenCalledWith(expect.objectContaining({
      title: en.pages.index.restoreIncompleteTitle,
    }));
    expect(routerPush).toHaveBeenCalledWith({ name: 'account' });
  });

  it('keeps the found accounts without a fallback when it gets locked while restoring', async () => {
    const { discoverAccounts, finish } = pendingDiscovery();
    const { accountsRaw, addRawAccount, isAuthenticated } = mountIndex({
      isAuthenticated: true,
      discoverAccounts,
    });
    await flushPromises();

    isAuthenticated.value = false; // Auto-lock on resume.
    addRawAccount(FOUND_ACCOUNT);
    finish();
    await flushPromises();

    expect(accountsRaw.value).toEqual([FOUND_ACCOUNT]);
  });

  it('restores once when it gets locked and unlocked while restoring', async () => {
    const { discoverAccounts, finish } = pendingDiscovery();
    const { accountsRaw, addRawAccount, isAuthenticated } = mountIndex({
      isAuthenticated: true,
      discoverAccounts,
    });
    await flushPromises();

    isAuthenticated.value = false; // Auto-lock on resume...
    await flushPromises();
    isAuthenticated.value = true; // ...and Face ID.
    await flushPromises();
    addRawAccount(FOUND_ACCOUNT);
    finish();
    await flushPromises();

    expect(discoverAccounts).toHaveBeenCalledTimes(1);
    expect(accountsRaw.value).toEqual([FOUND_ACCOUNT]);
    expect(routerPush).toHaveBeenCalledTimes(1);
  });

  it('opens it once it gets unlocked on this page', async () => {
    const { discoverAccounts, isAuthenticated } = mountIndex();
    await flushPromises();
    expect(discoverAccounts).not.toHaveBeenCalled();

    isAuthenticated.value = true; // E.g. Face ID when the app is resumed.
    await flushPromises();

    expect(discoverAccounts).toHaveBeenCalledTimes(1);
    expect(routerPush).toHaveBeenCalledWith({ name: 'account' });
  });

  it('opens a wallet that has accounts once unlocked, without restoring them', async () => {
    const { discoverAccounts, accountsRaw, isAuthenticated } = mountIndex();
    await flushPromises();

    accountsRaw.value = [FOUND_ACCOUNT];
    isAuthenticated.value = true;
    await flushPromises();

    expect(discoverAccounts).not.toHaveBeenCalled();
    expect(routerPush).toHaveBeenCalledWith({ name: 'account' });
  });

  it('leaves it to the shown page when this one is not shown', async () => {
    currentRoute.value = { name: 'about-terms' };
    const { discoverAccounts } = mountIndex({ isAuthenticated: true });
    await flushPromises();

    expect(discoverAccounts).not.toHaveBeenCalled();
    expect(routerPush).not.toHaveBeenCalled();
  });

  // Ionic keeps this page mounted, so coming back to it doesn't run the startup check again.
  describe('shown again after it got unlocked on another page', () => {
    async function mountIndexUnlockedElsewhere() {
      const mounted = mountIndex();
      currentRoute.value = { name: 'about-terms' };
      mounted.isAuthenticated.value = true; // E.g. Face ID on resume while reading the terms.
      await flushPromises();
      currentRoute.value = { name: ROUTE_INDEX };
      await flushPromises();
      expect(mounted.discoverAccounts).not.toHaveBeenCalled();
      return mounted;
    }

    it('opens it instead of creating a wallet over it', async () => {
      const mounted = await mountIndexUnlockedElsewhere();

      await tap(mounted.wrapper, 'generate-wallet');

      expect(mounted.setMnemonicAndInitializeAuthentication).not.toHaveBeenCalled();
      expect(mounted.discoverAccounts).toHaveBeenCalledTimes(1);
      expect(mounted.accountsRaw.value).toEqual([FOUND_ACCOUNT]);
      expect(routerPush).toHaveBeenCalledWith({ name: 'account' });
    });

    it('opens it instead of importing a wallet over it', async () => {
      const mounted = await mountIndexUnlockedElsewhere();

      await tap(mounted.wrapper, 'import-wallet');

      expect(mounted.openModal).not.toHaveBeenCalled();
      expect(mounted.discoverAccounts).toHaveBeenCalledTimes(1);
      expect(routerPush).toHaveBeenCalledWith({ name: 'account' });
    });
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

describe('Index page with no wallet loaded', () => {
  it('creates a wallet without asking, and does not restore it', async () => {
    const {
      wrapper, openConfirmModal, discoverAccounts, accountsRaw,
      setMnemonicAndInitializeAuthentication,
    } = mountIndex({ mnemonic: '' });

    await tap(wrapper, 'generate-wallet');

    expect(openConfirmModal).not.toHaveBeenCalled();
    expect(setMnemonicAndInitializeAuthentication).toHaveBeenCalledWith('new mnemonic');
    expect(discoverAccounts).not.toHaveBeenCalled();
    expect(accountsRaw.value).toEqual([{
      isRestored: false,
      protocol: PROTOCOLS.aeternity,
      type: ACCOUNT_TYPES.hdWallet,
    }]);
    expect(routerPush).toHaveBeenCalledTimes(1);
  });

  // Ionic keeps this page mounted, so a lock and a dismissed Face ID can bring the user back here.
  it('opens the created wallet when it gets unlocked again on this page', async () => {
    const {
      wrapper, discoverAccounts, isAuthenticated, setMnemonicAndInitializeAuthentication,
    } = mountIndex({ mnemonic: '' });
    await tap(wrapper, 'generate-wallet');
    routerPush.mockClear();

    isAuthenticated.value = false; // Auto-lock on resume, Face ID dismissed.
    await flushPromises();
    isAuthenticated.value = true; // Face ID on the next resume.
    await flushPromises();
    expect(routerPush).toHaveBeenCalledWith({ name: 'account' });

    await tap(wrapper, 'generate-wallet');
    expect(setMnemonicAndInitializeAuthentication).toHaveBeenCalledTimes(1);
    expect(discoverAccounts).not.toHaveBeenCalled();
  });

  it('opens the import without asking', async () => {
    const { wrapper, openConfirmModal, openModal } = mountIndex({ mnemonic: '' });

    await tap(wrapper, 'import-wallet');

    expect(openConfirmModal).not.toHaveBeenCalled();
    expect(openModal).toHaveBeenCalledWith(MODAL_ACCOUNT_IMPORT);
  });

  it('stops creating when a wallet that failed to load turns out to be stored', async () => {
    const { wrapper, addRawAccount, openDefaultModal } = mountIndex({
      mnemonic: '',
      setMnemonicAndInitializeAuthentication: vi.fn()
        .mockRejectedValue(new StoredWalletFoundError()),
    });

    await expect(wrapper.vm.createWallet()).resolves.toBeUndefined();

    expect(addRawAccount).not.toHaveBeenCalled();
    expect(routerPush).not.toHaveBeenCalled();
    expect(openDefaultModal).not.toHaveBeenCalled();
  });

  it('reports that the wallet was not saved and passes the failure on', async () => {
    const { wrapper, addRawAccount, openDefaultModal } = mountIndex({
      mnemonic: '',
      setMnemonicAndInitializeAuthentication: vi.fn()
        .mockRejectedValue(new Error('Keychain write failed')),
    });

    await expect(wrapper.vm.createWallet()).rejects.toThrow('Keychain write failed');

    expect(openDefaultModal).toHaveBeenCalledWith({
      icon: 'critical',
      msg: en.pages.index.walletNotSaved,
    });
    expect(addRawAccount).not.toHaveBeenCalled();
    expect(routerPush).not.toHaveBeenCalled();
  });

  it('reports nothing when the blockchain selection is dismissed', async () => {
    const { wrapper, openDefaultModal, setMnemonicAndInitializeAuthentication } = mountIndex({
      mnemonic: '',
      openModal: vi.fn().mockRejectedValue(undefined),
    });

    await expect(wrapper.vm.createWallet()).rejects.toBeUndefined();

    expect(setMnemonicAndInitializeAuthentication).not.toHaveBeenCalled();
    expect(openDefaultModal).not.toHaveBeenCalled();
  });

  it('reports nothing on web, where it fails when the password is cancelled', async () => {
    platform.isMobileApp = false;
    const { wrapper, openDefaultModal } = mountIndex({
      mnemonic: '',
      setMnemonicAndInitializeAuthentication: vi.fn().mockRejectedValue(new Error('cancelled')),
    });

    await expect(wrapper.vm.createWallet()).rejects.toThrow('cancelled');

    expect(openDefaultModal).not.toHaveBeenCalled();
  });
});
