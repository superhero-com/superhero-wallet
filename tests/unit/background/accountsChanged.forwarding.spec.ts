// @ts-nocheck
const OFFSCREEN_DOCUMENT = { id: 'test-extension-id', url: 'chrome-extension://test-extension-id/offscreen.html' };

describe('background accountsChanged forwarding', () => {
  const sendMessageMock = vi.fn();
  const queryMock = vi.fn().mockResolvedValue([{ id: 123 }]);

  beforeEach(async () => {
    sendMessageMock.mockReset().mockResolvedValue(undefined);
    queryMock.mockClear();
    (global as any).browser = {
      runtime: {
        id: 'test-extension-id',
        onMessage: { addListener: vi.fn() },
        getURL: vi.fn((path) => `chrome-extension://test-extension-id/${path}`),
        getContexts: vi.fn().mockResolvedValue([{}]),
        offscreen: { createDocument: vi.fn().mockResolvedValue(undefined) },
        onInstalled: { addListener: vi.fn() },
      },
      tabs: { query: queryMock, sendMessage: sendMessageMock },
    } as any;
    vi.doMock('@/background/utils', () => ({ registerInPageContentScript: vi.fn(), updateDynamicRules: vi.fn() }));
    vi.resetModules();
  });

  it('forwards accountsChanged to content script with correct payload', async () => {
    // re-require to bind listeners with mocked browser
    vi.resetModules();
    // eslint-disable-next-line global-require
    (await import('@/background/index'));

    const listener = (
      (global as any).browser.runtime.onMessage.addListener as vi.Mock
    ).mock.calls[0][0];

    await listener(
      {
        target: 'background',
        method: 'accountsChanged',
        params: { rpcMethodParams: { result: ['0xabc'] } },
      },
      OFFSCREEN_DOCUMENT,
      vi.fn(),
    );

    expect(queryMock).toHaveBeenCalledWith({});

    const sendCalls = ((global as any).browser.tabs.sendMessage as vi.Mock).mock.calls;
    expect(sendCalls.some((args: any[]) => (
      args[0] === 123
      && args[1]?.superheroWalletApproved === true
      && args[1]?.method === 'accountsChanged'
      && Array.isArray(args[1]?.result)
      && args[1]?.result[0] === '0xabc'
      && args[1]?.type === 'result'
    ))).toBe(true);
  });

  it.each([
    'chainChanged',
    'accountsChanged',
  ])('forwards %s to every tab, also after one without the content script', async (method) => {
    vi.resetModules();
    (await import('@/background/index'));
    const listener = (
      (global as any).browser.runtime.onMessage.addListener as vi.Mock
    ).mock.calls[0][0];
    queryMock.mockResolvedValueOnce([{ id: 1 }, { id: 2 }]);
    sendMessageMock.mockRejectedValueOnce(new Error('Could not establish connection. Receiving end does not exist.'));

    listener(
      { target: 'background', method, params: { rpcMethodParams: { result: '0x38' } } },
      OFFSCREEN_DOCUMENT,
      vi.fn(),
    );
    await new Promise((resolve) => { setTimeout(resolve); });

    expect(sendMessageMock.mock.calls.map(([tabId, message]) => [tabId, message.method]))
      .toEqual([[1, method], [2, method]]);
  });

  it.each([
    ['null sender', null],
    ['undefined sender', undefined],
    ['external extension sender', { id: 'some-other-extension-id' }],
    ['content-script sender with no id', {}],
  ])('drops accountsChanged when sender is %s', async (_label, sender) => {
    vi.resetModules();
    // eslint-disable-next-line global-require
    (await import('@/background/index'));

    const listener = (
      (global as any).browser.runtime.onMessage.addListener as vi.Mock
    ).mock.calls[0][0];

    const result = await listener(
      {
        target: 'background',
        method: 'accountsChanged',
        params: { rpcMethodParams: { result: ['0xbeef'] } },
      },
      sender,
      vi.fn(),
    );

    expect(result).toBeUndefined();
    await new Promise((resolve) => { setTimeout(resolve, 0); });
    expect(
      ((global as any).browser.tabs.sendMessage as vi.Mock).mock.calls,
    ).toHaveLength(0);
  });

  it.each([
    ['message for another target', { target: 'offscreen', method: 'accountsChanged' }],
    ['unknown background method', { target: 'background', method: 'unknownMethod' }],
  ])('does not claim unhandled messages: %s', async (_label, msg) => {
    vi.resetModules();
    // eslint-disable-next-line global-require
    (await import('@/background/index'));

    const listener = (
      (global as any).browser.runtime.onMessage.addListener as vi.Mock
    ).mock.calls[0][0];

    const result = await listener(
      msg,
      OFFSCREEN_DOCUMENT,
      vi.fn(),
    );

    expect(result).toBeUndefined();
  });
});
