const sourceTab = {
  id: 5, windowId: 2, active: true, url: 'https://dapp.example/',
};
const requestTab = { tabId: sourceTab.id, topLevelOrigin: 'https://dapp.example' };
const parent = {
  id: sourceTab.windowId,
  type: 'normal',
  state: 'normal',
  focused: true,
  left: 120,
  top: 55,
  width: 1000,
  height: 800,
};
const extensionUrl = 'chrome-extension://wallet/';
const nativeOptions = {
  type: 'popup', width: 375, height: 630, url: expect.any(String),
};
const positionedOptions = { ...nativeOptions, left: 745, top: 55 };
const invalidBounds = new Error('Invalid value for bounds. Bounds must be at least 50% within visible screen space.');

describe('detached approval placement', () => {
  let handler;
  let tabs;
  let nextWindowId;
  let focusedWindow;

  function createWindow({ url }) {
    const id = nextWindowId;
    nextWindowId += 1;
    tabs.push({
      id: id + 100, windowId: id, active: true, url,
    });
    return { id };
  }

  function closeWindow(popup) {
    const { windowId } = tabs.find(({ url }) => new URL(url).searchParams.get('id') === popup.id);
    tabs = tabs.filter((tab) => tab.windowId !== windowId);
  }

  beforeEach(async () => {
    vi.resetModules();
    vi.stubEnv('PLATFORM', 'extension');
    vi.stubEnv('RUNNING_IN_TESTS', '');
    nextWindowId = 20;
    focusedWindow = parent;
    tabs = [sourceTab, { ...sourceTab, id: 6, windowId: 3 }];
    vi.stubGlobal('browser', {
      runtime: {
        getURL: (path) => new URL(path, extensionUrl).href,
        getPlatformInfo: vi.fn().mockResolvedValue({ os: 'win' }),
      },
      windows: {
        create: vi.fn(createWindow),
        getLastFocused: vi.fn(async ({ populate }) => ({
          ...focusedWindow,
          tabs: populate ? tabs.filter((tab) => tab.windowId === focusedWindow.id) : undefined,
        })),
      },
      tabs: {
        query: vi.fn(async ({ windowId }) => tabs.filter((tab) => (
          windowId === undefined || tab.windowId === windowId
        ))),
        remove: vi.fn(),
      },
    });
    handler = await import('@/background/bgPopupHandler');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  function sign(props = requestTab, url = sourceTab.url, sidePanels = []) {
    return handler.openPopup('sign', url, props, sidePanels);
  }

  it.each([
    [extensionUrl, 'win', parent, 375, 745, 55],
    ['moz-extension://wallet/', 'mac', {
      ...parent, state: 'maximized', left: -1200, top: -650,
    }, 360, -560, -650],
  ])('positions the foreground approval for %s on %s', async (baseUrl, os, window, width, left, top) => {
    browser.runtime.getURL = (path) => new URL(path, baseUrl).href;
    browser.runtime.getPlatformInfo.mockResolvedValue({ os });
    focusedWindow = window;
    const popup = await sign();
    expect(browser.windows.create).toHaveBeenCalledExactlyOnceWith({
      ...nativeOptions, width, left, top,
    });
    expect(handler.getPopup(popup.id)).toEqual(popup);
    handler.removePopup(popup.id);
    expect(handler.getPopup(popup.id)).toBeUndefined();
  });

  it('leaves placement to Firefox on Windows', async () => {
    browser.runtime.getURL = (path) => new URL(path, 'moz-extension://wallet/').href;
    await sign();
    expect(browser.windows.create).toHaveBeenCalledExactlyOnceWith(nativeOptions);
  });

  it.each([
    ['the requesting tab has closed', {}, { ...requestTab, tabId: 99 }],
    ['the same site is active in a different window', {}, { ...requestTab, tabId: 6 }],
    ['the requesting top-level origin is missing', {}, { tabId: sourceTab.id }],
    ['the request has no tab', {}, {}],
    ['WalletConnect supplies the site', {}, { app: { originSource: 'self-reported' } }],
    ['another application has focus', { focused: false }],
    ['another popup has focus', { type: 'popup' }],
    ['the window is minimized', { state: 'minimized' }],
    ['the window is fullscreen', { state: 'fullscreen' }],
    ['part of the bounds is unavailable', { top: undefined }],
    ['a coordinate is fractional', { left: 1.5 }],
    ['the window is too narrow', { width: 374 }],
    ['the window is too short', { height: 629 }],
  ])('leaves placement to the browser when %s', async (_case, bounds, props) => {
    focusedWindow = { ...parent, ...bounds };
    await sign(props);
    expect(browser.windows.create).toHaveBeenCalledExactlyOnceWith(nativeOptions);
  });

  it('opens an approval when its parent window can no longer be read', async () => {
    browser.windows.getLastFocused.mockRejectedValue(new Error('Window closed'));
    await sign();
    expect(browser.windows.create).toHaveBeenCalledExactlyOnceWith(nativeOptions);
  });

  it('opens a detached approval when the active tab cannot be read', async () => {
    browser.windows.getLastFocused.mockResolvedValue(parent);
    const popup = await sign(requestTab, sourceTab.url, [parent.id]);
    expect(popup.sidePanelWindowId).toBeUndefined();
    expect(browser.windows.create).toHaveBeenCalledExactlyOnceWith(nativeOptions);
  });

  it('leaves an open side panel independent of detached placement', async () => {
    const panel = await sign(requestTab, sourceTab.url, [parent.id]);
    expect(panel.sidePanelWindowId).toBe(parent.id);
    expect(browser.windows.create).not.toHaveBeenCalled();
    await sign();
    expect(browser.windows.create).toHaveBeenCalledExactlyOnceWith(positionedOptions);
  });

  it('leaves placement to the browser when an existing approval cannot be ruled out', async () => {
    browser.tabs.query.mockRejectedValue(new Error('Tabs unavailable'));
    await sign();
    expect(browser.windows.create).toHaveBeenCalledExactlyOnceWith(nativeOptions);
  });

  it('uses an eligible side panel even if the detached window size cannot be read', async () => {
    browser.runtime.getPlatformInfo.mockRejectedValue(new Error('Platform unavailable'));
    const panel = await sign(requestTab, sourceTab.url, [parent.id]);
    expect(panel.sidePanelWindowId).toBe(parent.id);
    expect(browser.windows.create).not.toHaveBeenCalled();
  });

  it('opens a default-sized detached approval when the platform lookup fails', async () => {
    browser.runtime.getPlatformInfo.mockRejectedValue(new Error('Platform unavailable'));
    const popup = await sign();
    expect(browser.windows.create).toHaveBeenCalledExactlyOnceWith(nativeOptions);
    expect(handler.getPopup(popup.id)).toBe(popup);
  });

  it.each([
    ['window', []], ['window', [parent.id]], ['tab', []], ['tab', [parent.id]],
  ])('reads the selected tab and focused %s after the scan (panels %j)', async (change, panels) => {
    let finishScan;
    const scannedTabs = tabs.slice();
    browser.tabs.query.mockReturnValueOnce(new Promise((resolve) => { finishScan = resolve; }));
    const opening = sign(requestTab, sourceTab.url, panels);
    if (change === 'window') focusedWindow = { ...parent, id: 3 };
    else tabs = [{ ...sourceTab, id: 7, url: 'https://other.example/' }];
    finishScan(scannedTabs);

    expect((await opening).sidePanelWindowId).toBeUndefined();
    expect(browser.windows.create).toHaveBeenCalledExactlyOnceWith(nativeOptions);
  });

  it.each([
    ['navigated to another site', 'https://other.example/', undefined],
    ['navigating to another site', sourceTab.url, 'https://other.example/'],
    ['showing an opaque URL', 'about:blank', undefined],
    ['missing its URL', undefined, undefined],
  ])('uses a detached window with native placement for a source tab %s', async (_, url, pendingUrl) => {
    let finishScan;
    const scannedTabs = tabs.slice();
    browser.tabs.query.mockReturnValueOnce(new Promise((resolve) => { finishScan = resolve; }));
    const opening = sign(requestTab, sourceTab.url, [parent.id]);
    tabs = [{ ...sourceTab, url, pendingUrl }];
    finishScan(scannedTabs);
    const popup = await opening;
    expect(popup.sidePanelWindowId).toBeUndefined();
    expect(browser.windows.create).toHaveBeenCalledExactlyOnceWith(nativeOptions);
  });

  it('anchors a frame to its embedding site after a same-origin path change', async () => {
    tabs = [{ ...sourceTab, url: 'https://dapp.example/checkout', pendingUrl: 'https://dapp.example/pay' }];
    const popup = await sign(requestTab, 'https://frame.example/pay');
    expect(browser.windows.create).toHaveBeenCalledExactlyOnceWith(positionedOptions);
    expect(popup.props.app.href).toBe('https://frame.example/pay');
    expect(popup.props).not.toHaveProperty('topLevelOrigin');
  });

  it('lets another site open and finish its approval while the first is still opening', async () => {
    let finishFirst;
    browser.windows.create.mockImplementationOnce((options) => new Promise((resolve) => {
      finishFirst = () => resolve(createWindow(options));
    }));
    const opening = sign();
    await vi.waitFor(() => expect(finishFirst).toBeDefined());
    const second = await sign(requestTab, 'https://frame.example/');
    expect(browser.windows.create).toHaveBeenNthCalledWith(1, positionedOptions);
    expect(browser.windows.create).toHaveBeenNthCalledWith(2, nativeOptions);
    const secondUrl = browser.windows.create.mock.calls[1][0].url;
    expect(new URL(secondUrl).searchParams.get('id')).toBe(second.id);
    finishFirst();
    const first = await opening;
    expect(first.id).not.toBe(second.id);
    handler.removePopup(first.id);
    closeWindow(first);
    expect(handler.getPopup(second.id)).toEqual(second);
    const third = await sign();
    expect(browser.windows.create).toHaveBeenNthCalledWith(3, nativeOptions);
    handler.removePopup(second.id);
    closeWindow(second);
    handler.removePopup(third.id);
    closeWindow(third);
    await sign();
    expect(browser.windows.create).toHaveBeenNthCalledWith(4, positionedOptions);
  });

  it('positions the next approval after an earlier window closes before its page connects', async () => {
    const abandoned = await sign();
    closeWindow(abandoned);
    await sign();
    expect(browser.windows.create).toHaveBeenNthCalledWith(2, positionedOptions);
  });

  it('honors a window created after another request took its tab snapshot', async () => {
    const snapshot = tabs.slice();
    let finishQuery;
    browser.tabs.query.mockImplementationOnce(() => new Promise((resolve) => {
      finishQuery = () => resolve(snapshot);
    }));
    const waiting = sign();
    await vi.waitFor(() => expect(finishQuery).toBeDefined());
    await sign(requestTab, 'https://frame.example/');
    finishQuery();
    await waiting;
    expect(browser.windows.create).toHaveBeenNthCalledWith(1, positionedOptions);
    expect(browser.windows.create).toHaveBeenNthCalledWith(2, nativeOptions);
  });

  it.each([
    ['wallet approval', extensionUrl, 'url', nativeOptions],
    ['loading wallet approval', extensionUrl, 'pendingUrl', nativeOptions],
    ['unrelated site', 'https://another.example/', 'url', positionedOptions],
  ])('checks the %s URL for an existing approval after a restart', async (_case, base, field, expected) => {
    const tab = { id: 10, windowId: 7, url: 'about:blank' };
    tab[field] = `${base}index.html?id=previous&type=sign&url=https%3A%2F%2Fother.example`;
    tabs.push(tab);
    await sign();
    expect(browser.windows.create).toHaveBeenCalledExactlyOnceWith(expected);
  });

  it('replaces a matching connection prompt after the wallet navigates to its approval route', async () => {
    const app = 'https://dapp.example/connect?redirect=%2Fswap%3Fasset%3DAE';
    const query = new URLSearchParams({ id: 'old', type: 'connectConfirm', url: app });
    const path = `index.html?${query}#/connect-confirm`;
    tabs.push(
      { id: 10, windowId: 7, url: extensionUrl + path },
      { id: 11, windowId: 8, url: `https://other.example/${path}` },
    );
    const popup = await handler.openPopup('connectConfirm', app, { tabId: sourceTab.id });
    expect(browser.tabs.remove).toHaveBeenCalledExactlyOnceWith(10);
    expect(handler.getPopup(popup.id).props.app.href).toBe(app);
  });

  it('keeps the request ID while retrying rejected bounds with native placement', async () => {
    browser.windows.create.mockRejectedValueOnce(invalidBounds);
    const popup = await sign();
    expect(browser.windows.create).toHaveBeenCalledTimes(2);
    const { url } = browser.windows.create.mock.calls[0][0];
    expect(browser.windows.create).toHaveBeenNthCalledWith(1, { ...positionedOptions, url });
    expect(browser.windows.create).toHaveBeenNthCalledWith(2, { ...nativeOptions, url });
    expect(new URL(url).searchParams.get('id')).toBe(popup.id);
    expect(handler.getPopup(popup.id)).toBe(popup);
  });

  it('accepts browser-adjusted bounds immediately', async () => {
    browser.windows.create.mockResolvedValue({ id: 20, left: 650, top: 70 });
    const popup = await sign();
    expect(handler.getPopup(popup.id)).toBe(popup);
    expect(browser.windows.create).toHaveBeenCalledExactlyOnceWith(positionedOptions);
  });

  it.each([
    ['unrelated creation error', [new Error('Access denied')], requestTab],
    ['rejected size-only creation', [invalidBounds], {}],
    ['failed bounds retry', [invalidBounds, new Error('Window creation failed')], requestTab],
  ])('reports a %s and releases placement for the next request', async (_case, errors, props) => {
    errors.forEach((error) => browser.windows.create.mockRejectedValueOnce(error));
    await expect(sign(props)).rejects.toThrow(errors.at(-1).message);
    expect(browser.windows.create).toHaveBeenCalledTimes(errors.length);
    const { url } = browser.windows.create.mock.calls[0][0];
    expect(handler.getPopup(new URL(url).searchParams.get('id'))).toBeUndefined();
    await sign();
    expect(browser.windows.create).toHaveBeenLastCalledWith(positionedOptions);
  });
});
