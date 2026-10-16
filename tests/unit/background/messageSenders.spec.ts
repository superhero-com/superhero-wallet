// @ts-nocheck
vi.mock('@/background/utils', () => ({
  registerInPageContentScript: vi.fn(),
  updateDynamicRules: vi.fn(),
}));

const EXTENSION_ID = 'test-extension-id';
const EXTENSION_URL = `chrome-extension://${EXTENSION_ID}/`;
const OFFSCREEN_DOCUMENT = { id: EXTENSION_ID, url: `${EXTENSION_URL}offscreen.html` };
const POPUP_WINDOW = { id: EXTENSION_ID, url: `${EXTENSION_URL}index.html?id=1&type=connectConfirm` };
const CONTENT_SCRIPT = {
  id: EXTENSION_ID,
  url: 'https://example.com/',
  tab: { id: 1 },
  frameId: 0,
};

const SESSION_KEY = new Uint8Array([1, 2, 3, 4]);
const SESSION_KEY_BASE64 = 'AQIDBA==';
const ONE_DAY = 24 * 60 * 60 * 1000;
const NO_RESPONSE = Symbol('no response');

const GET_SESSION_KEY = { target: 'background', method: 'getSessionEncryptionKey' };
const OPEN_POPUP = {
  target: 'background',
  method: 'openPopup',
  params: { popupType: 'connectConfirm', aepp: 'https://dapp.example', popupProps: {} },
};

function setSessionTimeout(payload) {
  return { target: 'background', method: 'setSessionTimeout', payload };
}

const flush = () => new Promise((resolve) => { setTimeout(resolve, 0); });

describe('background message senders', () => {
  let listener;
  let session;

  async function loadListener(extensionUrl = EXTENSION_URL) {
    vi.resetModules();
    session = { exportedEncryptionKey: SESSION_KEY };
    (global as any).browser = {
      runtime: {
        id: EXTENSION_ID,
        getURL: (path) => `${extensionUrl}${path}`,
        getContexts: vi.fn().mockResolvedValue([{}]),
        getPlatformInfo: vi.fn().mockResolvedValue({ os: 'linux' }),
        onMessage: { addListener: vi.fn() },
        onInstalled: { addListener: vi.fn() },
      },
      storage: {
        session: {
          get: async (key) => ({ [key]: session[key] }),
          remove: async (key) => { delete session[key]; },
        },
      },
      tabs: {
        query: vi.fn().mockResolvedValue([{ id: 7, url: 'https://dapp.example/' }]),
        sendMessage: vi.fn(),
      },
      windows: {
        getLastFocused: vi.fn().mockResolvedValue({ id: 2, focused: true, state: 'normal' }),
        create: vi.fn().mockResolvedValue({ id: 9 }),
      },
    };
    await import('@/background/index');
    [[listener]] = browser.runtime.onMessage.addListener.mock.calls;
  }

  /** What the sender gets back, like the browser delivers it. */
  function sendMessage(msg, sender) {
    return new Promise((resolve) => {
      let responded = false;
      const keepsChannelOpen = listener(msg, sender, (response) => {
        responded = true;
        resolve(response);
      });
      if (keepsChannelOpen !== true && !responded) {
        resolve(NO_RESPONSE);
      }
    });
  }

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('session encryption key', () => {
    it.each([
      ['the offscreen document', OFFSCREEN_DOCUMENT],
      ['a popup window', POPUP_WINDOW],
    ])('is given to %s', async (_label, sender) => {
      await loadListener();

      expect(await sendMessage(GET_SESSION_KEY, sender)).toBe(SESSION_KEY_BASE64);
    });

    it('is given to Firefox extension pages, whose URL has a UUID instead of the id', async () => {
      await loadListener('moz-extension://4f8b-uuid/');

      expect(await sendMessage(
        GET_SESSION_KEY,
        { id: EXTENSION_ID, url: 'moz-extension://4f8b-uuid/offscreen.html' },
      )).toBe(SESSION_KEY_BASE64);
    });

    it('is kept from content scripts', async () => {
      await loadListener();
      const sendResponse = vi.fn();

      const keepsChannelOpen = listener(GET_SESSION_KEY, CONTENT_SCRIPT, sendResponse);
      await flush();

      expect(sendResponse).not.toHaveBeenCalled();
      expect(keepsChannelOpen).toBeUndefined();
    });
  });

  describe('session timeout', () => {
    it('locks the wallet when the timeout set by the wallet ends', async () => {
      await loadListener();
      vi.useFakeTimers();

      await sendMessage(setSessionTimeout(1000), OFFSCREEN_DOCUMENT);
      await vi.advanceTimersByTimeAsync(1000);

      expect(await sendMessage(GET_SESSION_KEY, OFFSCREEN_DOCUMENT)).toBeNull();
    });

    it('does not let a content script keep the wallet unlocked', async () => {
      await loadListener();
      vi.useFakeTimers();

      await sendMessage(setSessionTimeout(1000), OFFSCREEN_DOCUMENT);
      await sendMessage(setSessionTimeout(ONE_DAY), CONTENT_SCRIPT);
      await vi.advanceTimersByTimeAsync(1000);

      expect(await sendMessage(GET_SESSION_KEY, OFFSCREEN_DOCUMENT)).toBeNull();
    });

    it('does not let a content script lock the wallet', async () => {
      await loadListener();
      vi.useFakeTimers();

      await sendMessage(setSessionTimeout(1000), OFFSCREEN_DOCUMENT);
      await sendMessage(setSessionTimeout(0), CONTENT_SCRIPT);
      await vi.advanceTimersByTimeAsync(999);

      expect(await sendMessage(GET_SESSION_KEY, OFFSCREEN_DOCUMENT)).toBe(SESSION_KEY_BASE64);
    });
  });

  describe('popups', () => {
    it('opens no popup for a content script', async () => {
      await loadListener();
      const sendResponse = vi.fn();

      listener(OPEN_POPUP, CONTENT_SCRIPT, sendResponse);
      await flush();

      expect(browser.windows.create).not.toHaveBeenCalled();
      expect(sendResponse).not.toHaveBeenCalled();
    });

    it('keeps the popups the wallet opened from content scripts', async () => {
      await loadListener();
      const popup = await sendMessage(OPEN_POPUP, OFFSCREEN_DOCUMENT);
      const byId = { params: { id: popup.id }, target: 'background' };

      expect(await sendMessage({ ...byId, method: 'getPopup' }, CONTENT_SCRIPT)).toBe(NO_RESPONSE);
      expect(await sendMessage({ ...byId, method: 'removePopup' }, CONTENT_SCRIPT)).toBe(NO_RESPONSE);
      expect(await sendMessage({ ...byId, method: 'getPopup' }, POPUP_WINDOW)).toEqual(popup);
    });
  });

  it.each(['accountsChanged', 'chainChanged'])('does not forward %s from a content script to the tab', async (method) => {
    await loadListener();

    listener(
      { target: 'background', method, params: { rpcMethodParams: { result: ['0xbeef'] } } },
      CONTENT_SCRIPT,
      vi.fn(),
    );
    await flush();

    expect(browser.tabs.sendMessage).not.toHaveBeenCalled();
  });

  it('answers nothing to the dapp requests content scripts send to the offscreen document', async () => {
    await loadListener();

    /** The shape `sendToOffscreen` in `content-scripts/inject.ts` sends. */
    expect(await sendMessage(
      {
        target: 'offscreen',
        jsonrpc: '2.0',
        id: null,
        method: 'eth_requestAccounts',
        params: { rpcMethodParams: [], aepp: 'https://example.com' },
      },
      CONTENT_SCRIPT,
    )).toBe(NO_RESPONSE);
  });
});
