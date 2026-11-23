// @ts-nocheck
describe('background openPopup message', () => {
  const activeTab = {
    id: 4, active: true, windowId: 2, url: 'https://dapp.example/',
  };
  beforeEach(async () => {
    vi.resetModules();
    (global as any).browser = {
      runtime: {
        id: 'test-extension-id',
        onMessage: { addListener: vi.fn() },
        getURL: vi.fn((path) => `chrome-extension://test-extension-id/${path}`),
        getContexts: vi.fn().mockResolvedValue([{}]),
        onInstalled: { addListener: vi.fn() },
      },
      tabs: { query: vi.fn().mockResolvedValue([activeTab]) },
      windows: {
        onRemoved: { addListener: vi.fn() },
        getLastFocused: vi.fn().mockResolvedValue({
          id: 2, focused: true, state: 'normal', tabs: [activeTab],
        }),
        create: vi.fn().mockResolvedValue({ id: 9 }),
      },
    };
    vi.doMock('@/background/utils', () => ({ registerInPageContentScript: vi.fn(), updateDynamicRules: vi.fn() }));
    await import('@/background/index');
  });

  it('leaves the popup to the side panel of the focused window', async () => {
    const [[listener]] = browser.runtime.onMessage.addListener.mock.calls;
    const sendResponse = vi.fn();

    listener(
      {
        target: 'background',
        method: 'openPopup',
        params: {
          popupType: 'connectConfirm',
          aepp: 'https://dapp.example',
          popupProps: {},
          sidePanelWindowIds: [2],
        },
      },
      { id: 'test-extension-id', url: 'chrome-extension://test-extension-id/offscreen.html' },
      sendResponse,
    );

    await vi.waitFor(() => expect(sendResponse).toHaveBeenCalled());
    expect(sendResponse.mock.calls[0][0].sidePanelWindowId).toBe(2);
    expect(browser.windows.create).not.toHaveBeenCalled();
  });

  it('replies when both positioned and browser-default creation fail', async () => {
    browser.windows.getLastFocused.mockResolvedValue({
      id: 2,
      focused: true,
      state: 'normal',
      type: 'normal',
      left: 0,
      top: 0,
      width: 1000,
      height: 800,
      tabs: [activeTab],
    });
    browser.windows.create
      .mockRejectedValueOnce(new Error('Invalid value for bounds. Bounds must be at least 50% within visible screen space.'))
      .mockRejectedValueOnce(new Error('Window creation failed'));
    const [[listener]] = browser.runtime.onMessage.addListener.mock.calls;
    const sendResponse = vi.fn();

    expect(listener(
      {
        target: 'background',
        method: 'openPopup',
        params: {
          popupType: 'connectConfirm',
          aepp: 'https://dapp.example',
          popupProps: { tabId: 4, topLevelOrigin: 'https://dapp.example' },
        },
      },
      { id: 'test-extension-id', url: 'chrome-extension://test-extension-id/offscreen.html' },
      sendResponse,
    )).toBe(true);

    await vi.waitFor(() => expect(sendResponse).toHaveBeenCalledWith(null));
    expect(sendResponse).toHaveBeenCalledOnce();
    expect(browser.windows.create).toHaveBeenCalledTimes(2);
  });
});
