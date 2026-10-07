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
    auth.mnemonic.value = await crypto.encrypt(key, MNEMONIC);
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

    auth.syncBackgroundEncryptionKey(); // offscreen boot, nobody logged in yet
    await vi.advanceTimersByTimeAsync(30000); // `CHECK_FOR_SESSION_KEY_TIMEOUT`
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

  it('switches to a new key (password change) once the mnemonic is encrypted with it', async () => {
    const first = await createSessionKey();
    await encryptMnemonicWith(first.key);
    getSessionEncryptionKeyOffscreenMock.mockResolvedValue(first.exported);
    await auth.syncBackgroundEncryptionKey();
    const firstKey = auth.encryptionKey.value;

    // The new key is published before the re-encrypted mnemonic reaches this tab.
    const second = await createSessionKey();
    getSessionEncryptionKeyOffscreenMock.mockResolvedValue(second.exported);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    auth.syncBackgroundEncryptionKey();
    await vi.waitFor(() => expect(warn).toHaveBeenCalled());
    expect(auth.encryptionKey.value).toBe(firstKey);

    await encryptMnemonicWith(second.key);
    auth.encryptionSalt.value = crypto.generateSalt(); // synced along with the new mnemonic

    await vi.waitFor(() => expect(auth.encryptionKey.value).not.toBe(firstKey));
    expect(auth.mnemonicDecrypted.value).toBe(MNEMONIC);
  });
});
