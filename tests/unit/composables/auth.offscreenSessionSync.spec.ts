// @ts-nocheck
const MNEMONIC = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
const getSessionEncryptionKeyOffscreenMock = vi.fn();

describe('useAuth().syncBackgroundEncryptionKey in the offscreen tab', () => {
  let auth;
  let crypto;

  async function createSessionKey() {
    const raw = globalThis.crypto.getRandomValues(new Uint8Array(32));
    return {
      key: await crypto.importEncryptionKey(raw),
      exported: Buffer.from(raw).toString('base64'),
    };
  }

  async function encryptMnemonicWith(key) {
    const { STORAGE_KEYS } = await import('@/constants');
    const { writeVaultField } = await import('@/lib/WalletVault');
    await writeVaultField(STORAGE_KEYS.mnemonic, await crypto.encrypt(key, MNEMONIC));
  }

  beforeEach(async () => {
    vi.resetModules();
    localStorage.clear();
    getSessionEncryptionKeyOffscreenMock.mockReset().mockResolvedValue(null);
    vi.doMock('@/offscreen/popupHandler', () => ({
      getSessionEncryptionKey: (...args) => getSessionEncryptionKeyOffscreenMock(...args),
    }));
    vi.doMock('@/lib/logger', () => ({ __esModule: true, default: { write: vi.fn() } }));
    vi.doMock('@/constants', async () => ({
      ...(await vi.importActual('@/constants')),
      IS_MOBILE_APP: false,
      IS_EXTENSION: false,
      IS_IOS: false,
      IS_OFFSCREEN_TAB: true,
      RUNNING_IN_TESTS: false,
    }));

    crypto = await import('@/utils/crypto');
    const { useAuth } = await import('@/composables/auth');
    auth = useAuth();
    await vi.waitFor(() => expect(auth.isMnemonicRestored.value).toBe(true));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('decrypts the mnemonic with the published session key once the salt is restored', async () => {
    const { key, exported } = await createSessionKey();
    await encryptMnemonicWith(key);
    getSessionEncryptionKeyOffscreenMock.mockResolvedValue(exported);

    auth.encryptionSalt.value = crypto.generateSalt();

    await vi.waitFor(() => expect(auth.mnemonicDecrypted.value).toBe(MNEMONIC));
    expect(auth.encryptionKey.value).toBeTruthy();
  });

  it('tries right away instead of after the first poll interval', async () => {
    const { key, exported } = await createSessionKey();
    await encryptMnemonicWith(key);
    getSessionEncryptionKeyOffscreenMock.mockResolvedValue(exported);

    auth.syncBackgroundEncryptionKey();

    // Well under `CHECK_FOR_SESSION_KEY_INTERVAL` (5 s).
    await vi.waitFor(() => expect(auth.mnemonicDecrypted.value).toBe(MNEMONIC), { timeout: 1000 });
  });

  it('stops polling after the timeout, and a later login starts it again', async () => {
    const { key, exported } = await createSessionKey();
    await encryptMnemonicWith(key);
    vi.useFakeTimers();
    const now = vi.spyOn(performance, 'now').mockReturnValue(0);

    const initialSync = auth.syncBackgroundEncryptionKey(); // nobody logged in yet
    now.mockReturnValue(30001);
    await vi.advanceTimersByTimeAsync(30000); // `CHECK_FOR_SESSION_KEY_TIMEOUT`
    await initialSync;
    getSessionEncryptionKeyOffscreenMock.mockClear();
    await vi.advanceTimersByTimeAsync(60000);
    expect(getSessionEncryptionKeyOffscreenMock).not.toHaveBeenCalled();

    // A login long after: `decrypt` settles on real timers only.
    vi.useRealTimers();
    getSessionEncryptionKeyOffscreenMock.mockResolvedValue(exported);
    auth.syncBackgroundEncryptionKey();

    await vi.waitFor(() => expect(auth.mnemonicDecrypted.value).toBe(MNEMONIC));
  });

  it('restarts the timeout when requested again while polling', async () => {
    vi.useFakeTimers();
    auth.syncBackgroundEncryptionKey();
    await vi.advanceTimersByTimeAsync(20000);
    auth.syncBackgroundEncryptionKey(); // new deadline: 20 s + 30 s

    await vi.advanceTimersByTimeAsync(20000); // past the first deadline
    getSessionEncryptionKeyOffscreenMock.mockClear();
    await vi.advanceTimersByTimeAsync(5000);

    expect(getSessionEncryptionKeyOffscreenMock).toHaveBeenCalled();
  });

  it('retries at once when requested during an attempt that read storage too early', async () => {
    const { key, exported } = await createSessionKey();
    await encryptMnemonicWith(key);
    let finishFirstAttempt;
    getSessionEncryptionKeyOffscreenMock
      .mockReturnValueOnce(new Promise((resolve) => { finishFirstAttempt = resolve; }))
      .mockResolvedValue(exported);
    vi.useFakeTimers();

    auth.syncBackgroundEncryptionKey(); // e.g. salt watcher
    auth.syncBackgroundEncryptionKey(); // `sessionKeyStored` arrives meanwhile
    finishFirstAttempt(null);

    // `waitFor` advances fake time only by its polling interval, far below 5 s.
    await vi.waitFor(() => expect(auth.mnemonicDecrypted.value).toBe(MNEMONIC));
  });

  it('syncs again when requested during an attempt that succeeds', async () => {
    const { key, exported } = await createSessionKey();
    await encryptMnemonicWith(key);
    let finishFirstAttempt;
    getSessionEncryptionKeyOffscreenMock
      .mockReturnValueOnce(new Promise((resolve) => { finishFirstAttempt = resolve; }))
      .mockResolvedValue(exported);

    const syncing = auth.syncBackgroundEncryptionKey();
    auth.syncBackgroundEncryptionKey(); // another login, possibly with a new key
    finishFirstAttempt(exported);
    await syncing;

    expect(getSessionEncryptionKeyOffscreenMock).toHaveBeenCalledTimes(2);
  });

  it('publishes no key when this tab locks while the attempt reads the session', async () => {
    const { key, exported } = await createSessionKey();
    await encryptMnemonicWith(key);
    let finishRead;
    getSessionEncryptionKeyOffscreenMock
      .mockReturnValueOnce(new Promise((resolve) => { finishRead = resolve; }))
      .mockResolvedValue(exported);

    const schedule = vi.spyOn(globalThis, 'setTimeout');
    const syncing = auth.syncBackgroundEncryptionKey();
    await vi.waitFor(() => expect(finishRead).toBeDefined());
    await auth.logout();
    finishRead(exported);
    // The attempt is over once the next one is scheduled, `CHECK_FOR_SESSION_KEY_INTERVAL` later.
    await vi.waitFor(() => expect(schedule.mock.calls.some(([, ms]) => ms > 1000)).toBe(true));

    expect(getSessionEncryptionKeyOffscreenMock).toHaveBeenCalledTimes(1);
    expect(auth.encryptionKey.value).toBeUndefined();
    expect(auth.mnemonicDecrypted.value).toBe('');
    auth.syncBackgroundEncryptionKey(); // ends the wait for the next attempt
    await syncing;
  });

  it('keeps the current encryptionKey object when the same key is synced again', async () => {
    const { key, exported } = await createSessionKey();
    await encryptMnemonicWith(key);
    getSessionEncryptionKeyOffscreenMock.mockResolvedValue(exported);
    await auth.syncBackgroundEncryptionKey();
    const syncedKey = auth.encryptionKey.value;

    await auth.syncBackgroundEncryptionKey();

    expect(auth.encryptionKey.value).toBe(syncedKey);
    expect(auth.mnemonicDecrypted.value).toBe(MNEMONIC);
  });

  it('locks on a password change in another window, then reads the data with the key it stores', async () => {
    const { STORAGE_KEYS } = await import('@/constants');
    const { WalletStorage } = await import('@/lib/WalletStorage');
    const { commitVault, readVault } = await import('@/lib/WalletVault');
    const first = await createSessionKey();
    await encryptMnemonicWith(first.key);
    getSessionEncryptionKeyOffscreenMock.mockResolvedValue(first.exported);
    await auth.syncBackgroundEncryptionKey();
    auth.secureLoginTimeoutDecrypted.value = '600000';
    await vi.waitFor(() => expect(WalletStorage.get(STORAGE_KEYS.secureLoginTimeout)).toBeTruthy());
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    // As that window's `setPassword`: the salt and every secret under the new key, at once.
    const second = await createSessionKey();
    const rotatedTimeout = await crypto.encrypt(second.key, '600000');
    const current = readVault();
    await commitVault(current, {
      ...current.values,
      [STORAGE_KEYS.encryptionSalt]: crypto.encodeBase64(crypto.generateSalt()),
      [STORAGE_KEYS.mnemonic]: await crypto.encrypt(second.key, MNEMONIC),
      [STORAGE_KEYS.secureLoginTimeout]: rotatedTimeout,
    });
    // The old key opens nothing stored any more.
    expect(auth.encryptionKey.value).toBeUndefined();
    expect(auth.mnemonicDecrypted.value).toBe('');

    // That window then stores its key in the session.
    getSessionEncryptionKeyOffscreenMock.mockResolvedValue(second.exported);
    await auth.syncBackgroundEncryptionKey();

    expect(auth.mnemonicDecrypted.value).toBe(MNEMONIC);
    await vi.waitFor(() => expect(auth.secureLoginTimeoutDecrypted.value).toBe('600000'));
    // Read with the new key, not stored again.
    expect(WalletStorage.get(STORAGE_KEYS.secureLoginTimeout)).toBe(rotatedTimeout);
  });
});
