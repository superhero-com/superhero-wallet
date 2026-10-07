// @ts-nocheck
// `browser` has only `runtime`, as in a Chrome offscreen document.
const MNEMONIC = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
const backgroundSessionKey = vi.fn();

describe('offscreen tab, popup login after the session key polling ended', () => {
  const originalBrowser = globalThis.browser;
  let onConnect;

  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
    backgroundSessionKey.mockReset().mockResolvedValue(null);
    const chromeOffscreenBrowser = {
      runtime: {
        id: 'ext-id',
        getURL: (url) => url,
        sendMessage: vi.fn(),
        onMessage: { addListener: vi.fn() },
        onConnect: { addListener: vi.fn((listener) => { onConnect = listener; }) },
      },
    };
    globalThis.browser = chromeOffscreenBrowser;
    vi.doMock('webextension-polyfill', () => ({ default: chromeOffscreenBrowser }));
    vi.doMock('@/offscreen/popupHandler', () => ({
      getSessionEncryptionKey: (...args) => backgroundSessionKey(...args),
      getPopup: vi.fn(),
      removePopup: vi.fn(),
    }));
    vi.doMock('@/background/bgPopupHandler', () => ({ setSessionTimeout: vi.fn() }));
    vi.doMock('@/lib/logger', () => ({ __esModule: true, default: { write: vi.fn() } }));
    vi.doMock('@/composables/aeSdk', () => ({
      useAeSdk: () => ({
        getAeSdk: vi.fn().mockResolvedValue({ _pushAccountsToApps: vi.fn() }),
        resetNode: vi.fn(),
        isAeSdkReady: { value: true },
      }),
    }));
    vi.doMock('@/constants', async () => ({
      ...(await vi.importActual('@/constants')),
      IS_MOBILE_APP: false,
      IS_IOS: false,
      IS_EXTENSION: false,
      IS_FIREFOX: false,
      IS_OFFSCREEN_TAB: true,
      RUNNING_IN_TESTS: false,
    }));
  });

  afterEach(() => {
    vi.useRealTimers();
    globalThis.browser = originalBrowser;
  });

  it('gets the aeternity account once the popup reports the stored session key', async () => {
    const {
      ACCOUNT_TYPES, CONNECTION_TYPES, PROTOCOLS, SESSION_METHODS, STORAGE_KEYS,
    } = await import('@/constants');
    const { WalletStorage } = await import('@/lib/WalletStorage');
    const {
      encodeBase64, encrypt, generateSalt, importEncryptionKey,
    } = await import('@/utils/crypto');
    const rawKey = globalThis.crypto.getRandomValues(new Uint8Array(32));
    WalletStorage.set(STORAGE_KEYS.encryptionSalt, encodeBase64(generateSalt()));
    WalletStorage.set(
      STORAGE_KEYS.mnemonic,
      await encrypt(await importEncryptionKey(rawKey), MNEMONIC),
    );
    WalletStorage.set(STORAGE_KEYS.accountsRaw, [
      { isRestored: true, protocol: PROTOCOLS.aeternity, type: ACCOUNT_TYPES.hdWallet },
    ]);

    vi.useFakeTimers();
    await import('@/protocols/registerAdapters');
    const { useAccounts } = await import('@/composables');
    await (await import('@/offscreen/wallet')).init();
    const { getLastActiveProtocolAccount } = useAccounts();

    // Boot: the tab polls for the key, but nobody logs in for a while.
    await vi.advanceTimersByTimeAsync(60000);
    expect(getLastActiveProtocolAccount(PROTOCOLS.aeternity)).toBeFalsy();

    // The popup login stores the key; nothing picks it up without a signal.
    vi.useRealTimers();
    backgroundSessionKey.mockResolvedValue(Buffer.from(rawKey).toString('base64'));
    await new Promise((resolve) => { setTimeout(resolve, 100); });
    expect(getLastActiveProtocolAccount(PROTOCOLS.aeternity)).toBeFalsy();

    let onPortMessage;
    await onConnect({
      name: CONNECTION_TYPES.SESSION,
      sender: { id: 'ext-id', url: 'chrome-extension://ext-id/index.html' },
      onMessage: { addListener: (listener) => { onPortMessage = listener; } },
      onDisconnect: { addListener: vi.fn() },
    });
    onPortMessage({ method: SESSION_METHODS.sessionKeyStored });

    await vi.waitFor(() => {
      expect(getLastActiveProtocolAccount(PROTOCOLS.aeternity)?.address).toMatch(/^ak_/);
    });
  });
});
