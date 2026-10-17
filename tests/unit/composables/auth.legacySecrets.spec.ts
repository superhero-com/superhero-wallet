// @ts-nocheck
import { mnemonicToSeedSync, validateMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english.js';

/**
 * Versions before the composables rewrite kept the seed phrase in plaintext in the
 * extension storage: the Vuex state (`state.mnemonic`, `state.account.privateKey`) and,
 * before that, top-level `mnemonic` and `userAccount` entries.
 * Runs the real `useAuth`, WebCrypto and `WalletStorage`; mocks only the modals, logger,
 * biometrics and `browser.storage.local`, which jsdom doesn't have.
 */
const MNEMONIC = 'legal winner thank year wave sausage worth useful legal winner thank yellow';
const OTHER_MNEMONIC = 'letter advice cage absurd amount doctor acoustic avoid letter advice cage above';
const SEED_HEX = Buffer.from(mnemonicToSeedSync(MNEMONIC)).toString('hex');
const PASSWORD = 'Pa55-w0rd!';
const ADDRESS = 'ak_2swhLkgBPeeADxVTAVCJnZLY5NZtCFiM93JxsEaMuC59euuFRQ';

const NON_SECRET_STATE = {
  migrations: { 0: true, 1: true, 7: true },
  backedUpSeed: true,
  accounts: {
    list: [{ idx: 0, type: 'hd-wallet', protocol: 'aeternity' }],
    activeIdx: 0,
  },
  invites: {
    invites: [{
      secretKey: { type: 'Buffer', data: Array.from({ length: 32 }, (_, i) => i + 1) },
      createdAt: 1600000000000,
    }],
  },
  permissions: { 'aepp.example.com': { host: 'aepp.example.com', address: true } },
  notificationSettings: [{ type: 'COMMENT_ON_TIP', checked: true }],
  hiddenCards: ['backup'],
};

const VUEX_STATE = {
  ...NON_SECRET_STATE,
  mnemonic: MNEMONIC,
  account: { publicKey: ADDRESS, privateKey: SEED_HEX },
};

/** Entries the extension stored before the Vuex state, in early 2020. */
const EARLY_ENTRIES = {
  mnemonic: MNEMONIC,
  userAccount: { publicKey: ADDRESS, privateKey: SEED_HEX },
  subaccounts: [{ name: 'Main Account', publicKey: ADDRESS, root: true }],
  backed_up_Seed: true,
};

function flushAsync() {
  return new Promise((resolve) => { setTimeout(resolve, 0); });
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

/** `browser.storage.local` with the JSON semantics of Chrome's extension storage. */
function installExtensionStorage(entries) {
  const store = clone(entries);
  const pick = (keys) => (keys == null ? Object.keys(store) : [keys].flat())
    .filter((key) => key in store);
  globalThis.browser.storage.local = {
    get: vi.fn(async (keys) => clone(
      Object.fromEntries(pick(keys).map((key) => [key, store[key]])),
    )),
    set: vi.fn(async (items) => { Object.assign(store, clone(items)); }),
    remove: vi.fn(async (keys) => { pick(keys).forEach((key) => delete store[key]); }),
    clear: vi.fn(async () => { pick().forEach((key) => delete store[key]); }),
  };
  return store;
}

/** Every BIP39 phrase, or the seed derived from one, found in any of the values. */
function findSeeds(values) {
  const text = JSON.stringify(values);
  const words = text.match(/[a-z]+/g) || [];
  const phrases = words.flatMap((_, idx) => [12, 15, 18, 21, 24]
    .map((length) => words.slice(idx, idx + length))
    .filter((phrase) => validateMnemonic(phrase.join(' '), wordlist))
    .map((phrase) => phrase.join(' ')));
  return text.includes(SEED_HEX) ? [...phrases, SEED_HEX] : phrases;
}

describe('useAuth: plaintext seed left by older versions', () => {
  let openSetPasswordModalMock;
  let originalLocalStorageApi;

  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
    originalLocalStorageApi = globalThis.browser.storage.local;

    openSetPasswordModalMock = vi.fn().mockResolvedValue(PASSWORD);
    vi.doMock('@aparajita/capacitor-biometric-auth', () => ({
      BiometricAuth: {
        checkBiometry: vi.fn().mockResolvedValue({ isAvailable: false }),
        authenticate: vi.fn().mockResolvedValue(undefined),
      },
    }));
    vi.doMock('@/composables/modals', () => ({
      useModals: () => ({
        openSetPasswordModal: (...args) => openSetPasswordModalMock(...args),
        openPasswordLoginModal: vi.fn().mockResolvedValue(undefined),
        openBiometricLoginModal: vi.fn(),
        openEnableBiometricLoginModal: vi.fn(),
        openConfirmModal: vi.fn(() => new Promise(() => {})),
        openModal: vi.fn(),
      }),
    }));
    vi.doMock('@/lib/logger', () => ({ __esModule: true, default: { write: vi.fn() } }));
    // Its `initPolyfills` import would replace the `browser` stub on every module reload.
    vi.doMock('@/offscreen/popupHandler', () => ({
      getSessionEncryptionKey: vi.fn().mockResolvedValue(null),
    }));
  });

  afterEach(() => {
    globalThis.browser.storage.local = originalLocalStorageApi;
  });

  /** Stores the mnemonic encrypted with the password, as the current versions do. */
  async function storeEncryptedMnemonic(mnemonic = MNEMONIC) {
    const { WalletStorage } = await import('@/lib/WalletStorage');
    const { STORAGE_KEYS } = await import('@/constants');
    const {
      encodeBase64,
      encrypt,
      generateEncryptionKey,
      generateSalt,
    } = await import('@/utils/crypto');
    const salt = generateSalt();
    const key = await generateEncryptionKey(PASSWORD, salt);
    WalletStorage.set(STORAGE_KEYS.encryptionSalt, encodeBase64(salt));
    WalletStorage.set(STORAGE_KEYS.mnemonic, await encrypt(key, mnemonic));
  }

  async function boot() {
    const { useAuth } = await import('@/composables/auth');
    const auth = useAuth();
    await vi.waitFor(() => expect(auth.isMnemonicRestored.value).toBe(true));
    return auth;
  }

  it('removes the seed once the password opens the encrypted copy, keeping the other data', async () => {
    const store = installExtensionStorage({ state: VUEX_STATE, ...EARLY_ENTRIES, txType: 'spend' });
    await storeEncryptedMnemonic();
    const auth = await boot();

    expect(await auth.authenticateWithPassword(PASSWORD)).toBe(true);

    await vi.waitFor(() => expect(findSeeds(store)).toEqual([]));
    expect(store).toEqual({
      state: NON_SECRET_STATE,
      subaccounts: EARLY_ENTRIES.subaccounts,
      backed_up_Seed: true,
      txType: 'spend',
    });
  });

  it('removes nothing when the password is wrong', async () => {
    const entries = { state: VUEX_STATE, ...EARLY_ENTRIES };
    const store = installExtensionStorage(entries);
    await storeEncryptedMnemonic();
    const auth = await boot();

    await expect(auth.authenticateWithPassword('wrong-password')).rejects.toThrow();
    await flushAsync();
    await new Promise((resolve) => { setTimeout(resolve, 100); });

    expect(auth.isAuthenticated.value).toBe(false);
    expect(store).toEqual(entries);
  });

  it('removes nothing when the stored copy no longer opens with the password', async () => {
    const entries = { state: VUEX_STATE, ...EARLY_ENTRIES };
    const store = installExtensionStorage(entries);
    await storeEncryptedMnemonic();
    const auth = await boot();
    // Another window changed the password; this one still holds the copy it read at boot.
    const { WalletStorage } = await import('@/lib/WalletStorage');
    const { STORAGE_KEYS } = await import('@/constants');
    const { encrypt, generateEncryptionKey, generateSalt } = await import('@/utils/crypto');
    const otherKey = await generateEncryptionKey('N3w-Pa55-w0rd!', generateSalt());
    WalletStorage.set(STORAGE_KEYS.mnemonic, await encrypt(otherKey, MNEMONIC));
    const decrypt = vi.spyOn(globalThis.crypto.subtle, 'decrypt');

    expect(await auth.authenticateWithPassword(PASSWORD)).toBe(true);
    // Trying the stored copy is the only decryption that fails.
    await vi.waitFor(() => expect(decrypt.mock.settledResults)
      .toContainEqual(expect.objectContaining({ type: 'rejected' })));
    await flushAsync();

    expect(store).toEqual(entries);
    decrypt.mockRestore();
  });

  it('opens the encrypted copy only when an older version left the seed', async () => {
    installExtensionStorage({ state: NON_SECRET_STATE });
    await storeEncryptedMnemonic();
    const auth = await boot();
    const getItem = vi.spyOn(Storage.prototype, 'getItem');

    expect(await auth.authenticateWithPassword(PASSWORD)).toBe(true);
    await vi.waitFor(() => expect(globalThis.browser.storage.local.get)
      .toHaveBeenCalledWith(['state', 'mnemonic', 'userAccount']));
    await flushAsync();

    expect(getItem.mock.calls.filter(([key]) => key.endsWith('_mnemonic'))).toEqual([]);
    getItem.mockRestore();
  });

  it('removes the seed of a wallet that only the Vuex state has, once its password is set', async () => {
    const store = installExtensionStorage({ state: VUEX_STATE });
    const auth = await boot();

    await auth.checkUserAuth();

    expect(openSetPasswordModalMock).toHaveBeenCalledTimes(1);
    expect(auth.isAuthenticated.value).toBe(true);
    await vi.waitFor(() => expect(findSeeds(store)).toEqual([]));
    expect(store).toEqual({ state: NON_SECRET_STATE });

    vi.resetModules();
    const restarted = await boot();
    expect(await restarted.authenticateWithPassword(PASSWORD)).toBe(true);
    expect(restarted.mnemonicDecrypted.value).toBe(MNEMONIC);
  });

  it('keeps a seed phrase that is not the one the password opens', async () => {
    const store = installExtensionStorage({
      state: { ...VUEX_STATE, mnemonic: OTHER_MNEMONIC },
      mnemonic: MNEMONIC,
    });
    await storeEncryptedMnemonic();
    const auth = await boot();

    expect(await auth.authenticateWithPassword(PASSWORD)).toBe(true);

    await vi.waitFor(() => expect(store.mnemonic).toBeUndefined());
    expect(store.state).toEqual({ ...NON_SECRET_STATE, mnemonic: OTHER_MNEMONIC });
  });
});
