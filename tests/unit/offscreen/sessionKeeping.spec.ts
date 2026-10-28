// @ts-nocheck
/**
 * Only a shown, top-level wallet page stops the auto-lock timer while it is open.
 * `browser` has only `runtime`, as in a Chrome offscreen document.
 */
describe('offscreen tab, session ports that keep the session', () => {
  const originalBrowser = globalThis.browser;
  let onConnect;
  let sendMessage;

  beforeEach(async () => {
    vi.resetModules();
    localStorage.clear();
    sendMessage = vi.fn();
    const chromeOffscreenBrowser = {
      runtime: {
        id: 'ext-id',
        getURL: (url) => `chrome-extension://ext-id/${url}`,
        sendMessage,
        onMessage: { addListener: vi.fn() },
        onConnect: { addListener: vi.fn((listener) => { onConnect = listener; }) },
      },
    };
    globalThis.browser = chromeOffscreenBrowser;
    vi.doMock('webextension-polyfill', () => ({ default: chromeOffscreenBrowser }));
    vi.doMock('@/offscreen/popupHandler', () => ({
      getSessionEncryptionKey: vi.fn().mockResolvedValue(null),
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
    await import('@/protocols/registerAdapters');
    await (await import('@/offscreen/wallet')).init();
  });

  afterEach(() => {
    globalThis.browser = originalBrowser;
  });

  async function connectSessionPort(sender) {
    const { CONNECTION_TYPES } = await import('@/constants');
    let disconnect;
    await onConnect({
      name: CONNECTION_TYPES.SESSION,
      sender: { id: 'ext-id', ...sender },
      onMessage: { addListener: vi.fn() },
      onDisconnect: { addListener: (listener) => { disconnect = listener; } },
    });
    return () => disconnect();
  }

  async function getTimeoutCalls() {
    const { SESSION_METHODS } = await import('@/constants');
    return sendMessage.mock.calls
      .map(([msg]) => msg)
      .filter(({ method }) => method === SESSION_METHODS.setSessionTimeout)
      .map(({ payload }) => payload);
  }

  it.each([
    ['the action popup', { url: 'chrome-extension://ext-id/index.html' }],
    ['the side panel', { url: 'chrome-extension://ext-id/index.html?sidepanel' }],
    ['a wallet tab', { url: 'chrome-extension://ext-id/index.html', tab: { id: 1 }, frameId: 0 }],
  ])('stops the timer while %s is open', async (_label, sender) => {
    const disconnect = await connectSessionPort(sender);
    expect(await getTimeoutCalls()).toEqual([null]);

    await disconnect();
    expect((await getTimeoutCalls()).at(-1)).toEqual(expect.any(Number));
  });

  it.each([
    ['a dapp\'s confirmation popup', { url: 'chrome-extension://ext-id/index.html?id=popup-1' }],
    ['a wallet page a website frames', {
      url: 'chrome-extension://ext-id/index.html', tab: { id: 1 }, frameId: 3,
    }],
  ])('does not stop the timer for %s', async (_label, sender) => {
    await connectSessionPort(sender);
    expect(await getTimeoutCalls()).toEqual([]);
  });
});
