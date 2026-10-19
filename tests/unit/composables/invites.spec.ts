// @ts-nocheck
import { encode, Encoding } from '@aeternity/aepp-sdk';

/**
 * An invite key controls the funds sent to its link, so it must not be readable from the
 * device storage without the password (or the mobile key).
 * Runs the real `useAuth`, `useInvites`, WebCrypto and storage (`localStorage`, which also
 * backs `browser.storage.local` and the secure storage outside the extension and the apps);
 * mocks only the modals, logger and biometrics.
 */
const MNEMONIC = 'legal winner thank year wave sausage worth useful legal winner thank yellow';
const PASSWORD = 'Pa55-w0rd!';
const NEW_PASSWORD = 'N3w-Pa55-w0rd!';

function randomKey() {
  return Buffer.from(globalThis.crypto.getRandomValues(new Uint8Array(32)));
}

const toHex = (secretKey) => Buffer.from(secretKey).toString('hex');

function readStorage() {
  return Object.fromEntries(Object.keys(localStorage)
    .map((key) => [key, localStorage.getItem(key)]));
}

/** Names the encodings of the key found anywhere in the storage. */
function findKeyInStorage(secretKey) {
  const stored = JSON.stringify(readStorage());
  const encodings = {
    bytes: Array.from(secretKey).join(','),
    hex: toHex(secretKey),
    base64: secretKey.toString('base64'),
    base64url: secretKey.toString('base64url'),
    // As in the invite link.
    base58: encode(secretKey, Encoding.Name).slice(3),
  };
  return Object.keys(encodings).filter((name) => (
    stored.toLowerCase().includes(encodings[name].toLowerCase())
  ));
}

/** Waits until the stored invites open with the current key, as after a password change. */
async function waitForInvitesUnderCurrentKey(auth) {
  const { WalletStorage } = await import('@/lib/WalletStorage');
  const { STORAGE_KEYS } = await import('@/constants');
  const { decrypt } = await import('@/utils/crypto');
  await vi.waitFor(() => decrypt(
    auth.encryptionKey.value,
    WalletStorage.get(STORAGE_KEYS.invitesEncrypted),
  ));
}

/** Stores what changing the password in another window does. This one doesn't see it. */
async function changePasswordInAnotherWindow(auth) {
  const { WalletStorage } = await import('@/lib/WalletStorage');
  const { STORAGE_KEYS } = await import('@/constants');
  const {
    decrypt,
    encodeBase64,
    encrypt,
    generateEncryptionKey,
    generateSalt,
  } = await import('@/utils/crypto');
  const salt = generateSalt();
  const newKey = await generateEncryptionKey(NEW_PASSWORD, salt);
  const storedInvites = await decrypt(
    auth.encryptionKey.value,
    WalletStorage.get(STORAGE_KEYS.invitesEncrypted),
  );
  WalletStorage.set(STORAGE_KEYS.encryptionSalt, encodeBase64(salt));
  WalletStorage.set(STORAGE_KEYS.mnemonic, await encrypt(newKey, MNEMONIC));
  WalletStorage.set(STORAGE_KEYS.invitesEncrypted, await encrypt(newKey, storedInvites));
}

describe('useInvites: invite keys at rest', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.doUnmock('@/constants');
    vi.doUnmock('@/lib/SecureMobileStorage');
    localStorage.clear();

    vi.doMock('@aparajita/capacitor-biometric-auth', () => ({
      BiometricAuth: {
        checkBiometry: vi.fn().mockResolvedValue({ isAvailable: false }),
        authenticate: vi.fn().mockResolvedValue(undefined),
      },
    }));
    vi.doMock('@/composables/modals', () => ({
      useModals: () => ({
        openSetPasswordModal: vi.fn().mockResolvedValue(PASSWORD),
        openPasswordLoginModal: vi.fn().mockResolvedValue(undefined),
        openBiometricLoginModal: vi.fn(),
        openEnableBiometricLoginModal: vi.fn(),
        openConfirmModal: vi.fn(() => new Promise(() => {})),
        openDefaultModal: vi.fn(),
        openModal: vi.fn(),
      }),
    }));
    vi.doMock('@/lib/logger', () => ({ __esModule: true, default: { write: vi.fn() } }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /** Stores the mnemonic encrypted with the password, as the current versions do. */
  async function createWallet() {
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
    WalletStorage.set(STORAGE_KEYS.mnemonic, await encrypt(key, MNEMONIC));
  }

  /** Loads the modules after a restart, as the app does. */
  async function load() {
    await import('@/protocols/registerAdapters');
    const { useAuth } = await import('@/composables/auth');
    const { useInvites } = await import('@/composables/invites');
    return { useAuth, useInvites };
  }

  async function unlock(password = PASSWORD) {
    const { useAuth, useInvites } = await load();
    const auth = useAuth();
    await vi.waitFor(() => expect(auth.isMnemonicRestored.value).toBe(true));
    expect(await auth.authenticateWithPassword(password)).toBe(true);
    return { auth, ...useInvites() };
  }

  /** Loads the modules again; the ones loaded before stay, as in another window. */
  async function restart(password = PASSWORD) {
    vi.resetModules();
    return unlock(password);
  }

  const openAnotherWindow = restart;

  /** Loads the modules but stays locked, as a window opened before the unlock. */
  async function openLockedWindow() {
    const { useAuth, useInvites } = await load();
    const auth = useAuth();
    await vi.waitFor(() => expect(auth.isMnemonicRestored.value).toBe(true));
    return { auth, ...useInvites() };
  }

  async function expectInvites(invites, secretKeys) {
    await vi.waitFor(() => expect(invites.value.map(({ secretKey }) => toHex(secretKey)))
      .toEqual(secretKeys.map(toHex)));
  }

  it('keeps the invite key out of the storage in any encoding', async () => {
    await createWallet();
    const { invites, addInvite } = await unlock();
    const secretKey = randomKey();

    await addInvite(secretKey);

    await expectInvites(invites, [secretKey]);
    expect(findKeyInStorage(secretKey)).toEqual([]);
  });

  it('brings the invite back with the same key after a restart', async () => {
    await createWallet();
    const { addInvite } = await unlock();
    const secretKey = randomKey();
    await addInvite(secretKey);

    const { invites } = await restart();

    await expectInvites(invites, [secretKey]);
  });

  it('keeps the invites readable after a password change', async () => {
    await createWallet();
    const { auth, addInvite } = await unlock();
    const secretKey = randomKey();
    await addInvite(secretKey);

    await auth.updatePassword(PASSWORD, NEW_PASSWORD);
    await waitForInvitesUnderCurrentKey(auth);
    const { invites } = await restart(NEW_PASSWORD);

    await expectInvites(invites, [secretKey]);
    expect(findKeyInStorage(secretKey)).toEqual([]);
  });

  it('keeps every invite added at the same time', async () => {
    await createWallet();
    const { addInvite } = await unlock();
    const [first, second] = [randomKey(), randomKey()];

    await Promise.all([addInvite(first), addInvite(second)]);
    const { invites } = await restart();

    await expectInvites(invites, [second, first]);
  });

  it('keeps the invites another window stored', async () => {
    await createWallet();
    const firstWindow = await unlock();
    const otherWindow = await openAnotherWindow();
    const [fromOther, fromFirst] = [randomKey(), randomKey()];

    await otherWindow.addInvite(fromOther);
    await firstWindow.addInvite(fromFirst);

    await expectInvites(firstWindow.invites, [fromFirst, fromOther]);
    await expectInvites((await restart()).invites, [fromFirst, fromOther]);
  });

  it('keeps the invites another window moved while this one was locked', async () => {
    const { WalletStorage } = await import('@/lib/WalletStorage');
    const { STORAGE_KEYS } = await import('@/constants');
    await createWallet();
    const createdBefore = randomKey();
    WalletStorage.set(STORAGE_KEYS.invites, [{ secretKey: createdBefore.toJSON(), createdAt: 1 }]);
    const lockedWindow = await openLockedWindow();
    const otherWindow = await openAnotherWindow();
    await expectInvites(otherWindow.invites, [createdBefore]);
    await vi.waitFor(() => expect(findKeyInStorage(createdBefore)).toEqual([]));

    expect(await lockedWindow.auth.authenticateWithPassword(PASSWORD)).toBe(true);
    const createdAfter = randomKey();
    await lockedWindow.addInvite(createdAfter);

    await expectInvites(lockedWindow.invites, [createdAfter, createdBefore]);
    await expectInvites((await restart()).invites, [createdAfter, createdBefore]);
  });

  it('does not bring back an invite another window moved and removed', async () => {
    await createWallet();
    const secretKey = randomKey();
    localStorage.setItem('state', JSON.stringify({
      invites: { invites: [{ secretKey: secretKey.toJSON(), createdAt: 1 }] },
    }));
    const lockedWindow = await openLockedWindow();
    // Read at start by the migrations of other data, and kept.
    const { collectVuexState } = await import('@/migrations/migrationHelpers');
    await collectVuexState();
    const otherWindow = await openAnotherWindow();
    await expectInvites(otherWindow.invites, [secretKey]);
    await vi.waitFor(() => expect(findKeyInStorage(secretKey)).toEqual([]));
    await otherWindow.removeInvite(secretKey);

    expect(await lockedWindow.auth.authenticateWithPassword(PASSWORD)).toBe(true);
    const createdAfter = randomKey();
    await lockedWindow.addInvite(createdAfter);

    await expectInvites(lockedWindow.invites, [createdAfter]);
    await expectInvites((await restart()).invites, [createdAfter]);
  });

  it('keeps the invites another window stored when the password changes', async () => {
    await createWallet();
    const { auth } = await unlock();
    const otherWindow = await openAnotherWindow();
    const fromOther = randomKey();
    await otherWindow.addInvite(fromOther);

    await auth.updatePassword(PASSWORD, NEW_PASSWORD);
    await waitForInvitesUnderCurrentKey(auth);

    await expectInvites((await restart(NEW_PASSWORD)).invites, [fromOther]);
  });

  it('stores no invite under the old key when the password changes meanwhile', async () => {
    await createWallet();
    const { auth, addInvite } = await unlock();
    const createdBefore = randomKey();
    await addInvite(createdBefore);

    // Holds the encryption of the next invites until the password has changed.
    let release;
    const released = new Promise((resolve) => { release = resolve; });
    const { subtle } = globalThis.crypto;
    const { encrypt } = subtle;
    const encryptSpy = vi.spyOn(subtle, 'encrypt').mockImplementationOnce(async (...args) => {
      await released;
      return encrypt.apply(subtle, args);
    });
    const adding = addInvite(randomKey());
    await vi.waitFor(() => expect(encryptSpy).toHaveBeenCalled());
    await auth.updatePassword(PASSWORD, NEW_PASSWORD);
    release();

    await expect(adding).rejects.toThrow('password changed');
    await waitForInvitesUnderCurrentKey(auth);
    const { invites } = await restart(NEW_PASSWORD);
    await expectInvites(invites, [createdBefore]);
  });

  it('stores no invite after the password was changed in another window', async () => {
    await createWallet();
    const { auth, addInvite } = await unlock();
    const createdBefore = randomKey();
    await addInvite(createdBefore);
    await changePasswordInAnotherWindow(auth);

    await expect(addInvite(randomKey())).rejects.toThrow('another window');
    const { invites } = await restart(NEW_PASSWORD);
    await expectInvites(invites, [createdBefore]);
  });

  it('changes no password in a window that missed a password change in another one', async () => {
    await createWallet();
    const { auth, addInvite } = await unlock();
    const createdBefore = randomKey();
    await addInvite(createdBefore);
    await changePasswordInAnotherWindow(auth);

    // This window still opens its copy of the seed with the old password.
    await expect(auth.updatePassword(PASSWORD, 'Th1rd-Pa55-w0rd!')).rejects.toThrow('another window');
    const { invites } = await restart(NEW_PASSWORD);
    await expectInvites(invites, [createdBefore]);
  });

  it('moves the invites of older versions out of the plaintext storage without losing them at any step', async () => {
    const { WalletStorage } = await import('@/lib/WalletStorage');
    const { STORAGE_KEYS } = await import('@/constants');
    await createWallet();
    const migratedFromVuex = randomKey();
    const createdLater = randomKey();
    const vuexState = {
      invites: { invites: [{ secretKey: migratedFromVuex.toJSON(), createdAt: 1 }] },
      permissions: { 'aepp.example.com': { host: 'aepp.example.com', address: true } },
    };
    localStorage.setItem('state', JSON.stringify(vuexState));
    WalletStorage.set(STORAGE_KEYS.invites, [
      { secretKey: createdLater.toJSON(), createdAt: 2 },
      { secretKey: migratedFromVuex.toJSON(), createdAt: 1 },
    ]);

    // What a crash after each write would leave behind.
    const snapshots = [];
    const recordSnapshot = () => {
      const snapshot = JSON.stringify(readStorage());
      if (snapshot !== snapshots.at(-1)) snapshots.push(snapshot);
    };
    const { setItem, removeItem } = Storage.prototype;
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function set(...args) {
      setItem.apply(this, args);
      recordSnapshot();
    });
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(function remove(...args) {
      removeItem.apply(this, args);
      recordSnapshot();
    });

    const { invites } = await unlock();

    await expectInvites(invites, [createdLater, migratedFromVuex]);
    await vi.waitFor(() => expect([
      ...findKeyInStorage(createdLater),
      ...findKeyInStorage(migratedFromVuex),
    ]).toEqual([]));
    vi.restoreAllMocks();
    expect(JSON.parse(localStorage.getItem('state'))).toEqual({ permissions: vuexState.permissions });

    // eslint-disable-next-line no-restricted-syntax
    for (const snapshot of snapshots) {
      localStorage.clear();
      Object.entries(JSON.parse(snapshot))
        .forEach(([key, value]) => localStorage.setItem(key, value));
      // eslint-disable-next-line no-await-in-loop
      const restarted = await restart();
      // eslint-disable-next-line no-await-in-loop
      await expectInvites(restarted.invites, [createdLater, migratedFromVuex]);
    }
  });

  it('moves the invites that only the Vuex state has', async () => {
    await createWallet();
    const secretKey = randomKey();
    localStorage.setItem('state', JSON.stringify({
      invites: { invites: [{ secretKey: secretKey.toJSON(), createdAt: 1 }] },
    }));

    const { invites } = await unlock();

    await expectInvites(invites, [secretKey]);
    await vi.waitFor(() => expect(findKeyInStorage(secretKey)).toEqual([]));
    expect(JSON.parse(localStorage.getItem('state'))).toEqual({});
  });

  it('removes the Vuex invites a cut-off move left behind', async () => {
    await createWallet();
    const secretKey = randomKey();
    localStorage.setItem('state', JSON.stringify({
      invites: { invites: [{ secretKey: secretKey.toJSON(), createdAt: 1 }] },
    }));
    // The invites get stored encrypted, then writing the Vuex state fails.
    const writeState = vi.spyOn(globalThis.browser.storage.local, 'set')
      .mockRejectedValueOnce(new Error('Storage unavailable'));
    const { invites } = await unlock();
    await expectInvites(invites, [secretKey]);
    await vi.waitFor(() => expect(writeState).toHaveBeenCalled());
    expect(JSON.parse(localStorage.getItem('state')).invites).toBeDefined();

    const restarted = await restart();

    await expectInvites(restarted.invites, [secretKey]);
    await vi.waitFor(() => expect(findKeyInStorage(secretKey)).toEqual([]));
    expect(JSON.parse(localStorage.getItem('state'))).toEqual({});
  });

  it('does not bring back a moved invite that was removed', async () => {
    await createWallet();
    const secretKey = randomKey();
    localStorage.setItem('state', JSON.stringify({
      invites: { invites: [{ secretKey: secretKey.toJSON(), createdAt: 1 }] },
    }));
    const {
      auth,
      invites,
      addInvite,
      removeInvite,
    } = await unlock();
    await expectInvites(invites, [secretKey]);
    await vi.waitFor(() => expect(findKeyInStorage(secretKey)).toEqual([]));

    await removeInvite(secretKey);
    await auth.lockWallet();
    expect(await auth.authenticateWithPassword(PASSWORD)).toBe(true);
    // Stored once the invites were read again after the unlock.
    const createdAfter = randomKey();
    await addInvite(createdAfter);

    await expectInvites(invites, [createdAfter]);
    await expectInvites((await restart()).invites, [createdAfter]);
  });

  it('shows and stores no invites while the wallet is locked', async () => {
    await createWallet();
    const { auth, invites, addInvite } = await unlock();
    const secretKey = randomKey();
    await addInvite(secretKey);

    await auth.lockWallet();
    const storedWhileLocked = readStorage();

    expect(invites.value).toEqual([]);
    await expect(addInvite(randomKey())).rejects.toThrow('locked');
    expect(readStorage()).toEqual(storedWhileLocked);

    expect(await auth.authenticateWithPassword(PASSWORD)).toBe(true);
    await expectInvites(invites, [secretKey]);
  });

  it('stores an invite added just before a lock and shows it after the unlock', async () => {
    await createWallet();
    const { auth, invites, addInvite } = await unlock();

    // Holds the encryption of the invite until the wallet is locked.
    let release;
    const released = new Promise((resolve) => { release = resolve; });
    const { subtle } = globalThis.crypto;
    const { encrypt } = subtle;
    const encryptSpy = vi.spyOn(subtle, 'encrypt').mockImplementationOnce(async (...args) => {
      await released;
      return encrypt.apply(subtle, args);
    });
    const secretKey = randomKey();
    const adding = addInvite(secretKey);
    await vi.waitFor(() => expect(encryptSpy).toHaveBeenCalled());
    await auth.lockWallet();
    release();

    await adding;
    expect(invites.value).toEqual([]);
    expect(await auth.authenticateWithPassword(PASSWORD)).toBe(true);
    await expectInvites(invites, [secretKey]);
    await expectInvites((await restart()).invites, [secretKey]);
  });

  it('does not replace stored invites it cannot read', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await createWallet();
    const { addInvite } = await unlock();
    const storedBefore = readStorage();
    await addInvite(randomKey());
    const storedAfter = readStorage();
    const changedEntries = Object.keys(storedAfter)
      .filter((key) => storedAfter[key] !== storedBefore[key]);
    expect(changedEntries).toHaveLength(1);
    const [invitesEntry] = changedEntries;
    // E.g. left encrypted with the previous password by a crash during a password change.
    const unreadable = storedAfter[invitesEntry].replace(/^"(.)/, (_, char) => `"${char === 'A' ? 'B' : 'A'}`);
    localStorage.setItem(invitesEntry, unreadable);

    const restarted = await restart();
    await vi.waitFor(() => expect(warn).toHaveBeenCalled());

    await expect(restarted.addInvite(randomKey())).rejects.toThrow('unreadable');
    expect(localStorage.getItem(invitesEntry)).toBe(unreadable);
    warn.mockRestore();
  });

  it('keeps the invite key out of the storage on mobile', async () => {
    vi.doMock('@/constants', async () => ({
      ...await vi.importActual('@/constants'),
      IS_MOBILE_APP: true,
    }));
    const { useAuth, useInvites } = await load();
    await useAuth().setMnemonicAndInitializeAuthentication(MNEMONIC);
    const secretKey = randomKey();

    await useInvites().addInvite(secretKey);
    expect(findKeyInStorage(secretKey)).toEqual([]);

    vi.resetModules();
    const { useAuth: useAuthRestarted, useInvites: useInvitesRestarted } = await load();
    await useAuthRestarted().checkUserAuth();
    await expectInvites(useInvitesRestarted().invites, [secretKey]);
  });

  it('keeps the invites on iOS when the Keychain reads back empty', async () => {
    vi.doMock('@/constants', async () => ({
      ...await vi.importActual('@/constants'),
      IS_MOBILE_APP: true,
    }));
    async function restartMobile() {
      vi.resetModules();
      const { useAuth, useInvites } = await load();
      await useAuth().checkUserAuth();
      return useInvites();
    }
    const first = await load();
    await first.useAuth().setMnemonicAndInitializeAuthentication(MNEMONIC);
    const createdBefore = randomKey();
    await first.useInvites().addInvite(createdBefore);

    // KeychainSwift returns nothing for any Keychain error, also for stored items.
    vi.doMock('@/lib/SecureMobileStorage', async (importOriginal) => {
      const { SecureMobileStorage } = await importOriginal();
      const { STORAGE_KEYS } = await vi.importActual('@/constants');
      const readable = [STORAGE_KEYS.mnemonic, STORAGE_KEYS.mobileDataKey];
      return {
        SecureMobileStorage: {
          ...SecureMobileStorage,
          get: async (keys) => (readable.includes(keys) ? SecureMobileStorage.get(keys) : null),
        },
      };
    });
    const createdAfter = randomKey();
    await (await restartMobile()).addInvite(createdAfter);

    vi.doUnmock('@/lib/SecureMobileStorage');
    await expectInvites((await restartMobile()).invites, [createdAfter, createdBefore]);
  });
});
