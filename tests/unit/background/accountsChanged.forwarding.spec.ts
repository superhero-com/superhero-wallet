// @ts-nocheck
describe('background accountsChanged forwarding', () => {
  const sendMessageMock = jest.fn();
  const queryMock = jest.fn().mockResolvedValue([{ id: 123 }]);

  beforeEach(() => {
    sendMessageMock.mockClear();
    queryMock.mockClear();
    (global as any).browser = {
      runtime: {
        id: 'test-extension-id',
        onMessage: { addListener: jest.fn() },
        getURL: jest.fn(() => 'offscreen.html'),
        getContexts: jest.fn().mockResolvedValue([{}]),
        offscreen: { createDocument: jest.fn().mockResolvedValue(undefined) },
        onInstalled: { addListener: jest.fn() },
      },
      tabs: { query: queryMock, sendMessage: sendMessageMock },
    } as any;
    jest.doMock('@/background/utils', () => ({ registerInPageContentScript: jest.fn(), updateDynamicRules: jest.fn() }));
    jest.resetModules();
  });

  it('forwards accountsChanged to content script with correct payload', async () => {
    // re-require to bind listeners with mocked browser
    jest.isolateModules(() => {
      // eslint-disable-next-line global-require
      require('@/background/index');
    });

    const listener = (
      (global as any).browser.runtime.onMessage.addListener as jest.Mock
    ).mock.calls[0][0];

    await listener(
      {
        target: 'background',
        method: 'accountsChanged',
        params: { rpcMethodParams: { result: ['0xabc'] } },
      },
      { id: 'test-extension-id' },
      jest.fn(),
    );

    const queryCalls = ((global as any).browser.tabs.query as jest.Mock).mock.calls;
    expect(queryCalls.some((args: any[]) => (
      args[0]?.active === true && args[0]?.lastFocusedWindow === true
    ))).toBe(true);

    const sendCalls = ((global as any).browser.tabs.sendMessage as jest.Mock).mock.calls;
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
    ['null sender', null],
    ['undefined sender', undefined],
    ['external extension sender', { id: 'some-other-extension-id' }],
    ['content-script sender with no id', {}],
  ])('drops accountsChanged when sender is %s', async (_label, sender) => {
    jest.isolateModules(() => {
      // eslint-disable-next-line global-require
      require('@/background/index');
    });

    const listener = (
      (global as any).browser.runtime.onMessage.addListener as jest.Mock
    ).mock.calls[0][0];

    const result = await listener(
      {
        target: 'background',
        method: 'accountsChanged',
        params: { rpcMethodParams: { result: ['0xbeef'] } },
      },
      sender,
      jest.fn(),
    );

    expect(result).toBeUndefined();
    await new Promise((resolve) => { setTimeout(resolve, 0); });
    expect(
      ((global as any).browser.tabs.sendMessage as jest.Mock).mock.calls,
    ).toHaveLength(0);
  });

  it.each([
    ['message for another target', { target: 'offscreen', method: 'accountsChanged' }],
    ['unknown background method', { target: 'background', method: 'unknownMethod' }],
  ])('does not claim unhandled messages: %s', async (_label, msg) => {
    jest.isolateModules(() => {
      // eslint-disable-next-line global-require
      require('@/background/index');
    });

    const listener = (
      (global as any).browser.runtime.onMessage.addListener as jest.Mock
    ).mock.calls[0][0];

    const result = await listener(
      msg,
      { id: 'test-extension-id' },
      jest.fn(),
    );

    expect(result).toBeUndefined();
  });
});
