// @ts-nocheck
describe('background openPopup message', () => {
  beforeEach(async () => {
    vi.resetModules();
    (global as any).browser = {
      runtime: {
        id: 'test-extension-id',
        onMessage: { addListener: vi.fn() },
        getURL: vi.fn((path) => path),
        getContexts: vi.fn().mockResolvedValue([{}]),
        onInstalled: { addListener: vi.fn() },
      },
      tabs: { query: vi.fn().mockResolvedValue([]) },
      windows: {
        getLastFocused: vi.fn().mockResolvedValue({ id: 2, focused: true, state: 'normal' }),
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
      { id: 'test-extension-id' },
      sendResponse,
    );

    await vi.waitFor(() => expect(sendResponse).toHaveBeenCalled());
    expect(sendResponse.mock.calls[0][0].sidePanelWindowId).toBe(2);
    expect(browser.windows.create).not.toHaveBeenCalled();
  });
});
