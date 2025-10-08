// @ts-nocheck
describe('background accountsChanged forwarding', () => {
  const sendMessageMock = jest.fn();
  const queryMock = jest.fn().mockResolvedValue([{ id: 123 }]);

  beforeEach(() => {
    (global as any).browser = {
      runtime: {
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
      null,
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
});
