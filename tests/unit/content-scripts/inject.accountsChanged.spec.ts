// @ts-nocheck
/* eslint-disable global-require */
describe('inject.ts accountsChanged propagation', () => {
  let postMessageSpy: jest.Mock;
  let origin: string;

  beforeEach(() => {
    jest.resetModules();
    postMessageSpy = jest.fn();
    origin = window.location.origin;

    // Mock browser runtime and resolve require path
    // @ts-expect-error
    (global as any).browser = {
      runtime: {
        onMessage: { addListener: jest.fn() },
        sendMessage: jest.fn().mockResolvedValue({}),
        connect: jest.fn(() => ({ onDisconnect: { addListener: jest.fn() } })),
      },
    };
    jest.doMock('webextension-polyfill', () => (global as any).browser, { virtual: true });

    jest.spyOn(window, 'addEventListener');
    jest.spyOn(window, 'postMessage').mockImplementation(postMessageSpy);

    // Load script
    // eslint-disable-next-line global-require, import/extensions
    jest.isolateModules(() => { require('@/content-scripts/inject.ts'); });

    // Simulate an RPC request that will store the source under connectedDapps
    const messageHandler = (window.addEventListener as jest.Mock).mock.calls.find((c) => c[0] === 'message')[1];
    // Await the async handler to ensure connectedDapps is populated
    return Promise.resolve().then(() => messageHandler({
      data: { method: 'eth_chainId', params: [] },
      origin,
      source: window,
    }));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('forwards accountsChanged to connected dapp source', async () => {
    await Promise.resolve();
    // Now simulate background pushing accountsChanged
    const runtimeListener = ((global as any).browser.runtime.onMessage.addListener as jest.Mock)
      .mock.calls[0][0];
    await runtimeListener({ method: 'accountsChanged', result: ['0xabc'] });
    const { calls } = postMessageSpy.mock;
    const found = calls.some((args) => (
      args[0]?.superheroWalletApproved === true
      && args[0]?.method === 'accountsChanged'
      && Array.isArray(args[0]?.result)
      && args[0]?.result[0] === '0xabc'
      && args[0]?.type === 'result'
      && args[1] === origin
    ));
    expect(found).toBe(true);
  });

  it.each([
    ['a mismatched origin', () => ({
      data: { superheroWalletRequest: true, method: 'eth_chainId', params: [] },
      origin: 'https://evil.example',
      source: window,
    })],
    ['a mismatched source', () => ({
      data: { superheroWalletRequest: true, method: 'eth_chainId', params: [] },
      origin,
      source: { postMessage: jest.fn() },
    })],
  ])('does not forward page requests from %s', async (_label, createEvent) => {
    const messageHandler = (window.addEventListener as jest.Mock).mock.calls.find((c) => c[0] === 'message')[1];
    ((global as any).browser.runtime.sendMessage as jest.Mock).mockClear();

    await messageHandler(createEvent());

    expect((global as any).browser.runtime.sendMessage).not.toHaveBeenCalled();
  });

  it('forwards aepp SDK page messages to the offscreen document', async () => {
    const messageHandler = (window.addEventListener as jest.Mock).mock.calls.find((c) => c[0] === 'message')[1];
    ((global as any).browser.runtime.sendMessage as jest.Mock).mockClear();

    const aeppMessage = {
      type: 'to_waellet',
      data: {
        jsonrpc: '2.0',
        id: 1,
        method: 'connection.open',
        params: {},
      },
    };

    await messageHandler({
      data: aeppMessage,
      origin,
      source: window,
    });

    expect((global as any).browser.runtime.sendMessage).toHaveBeenCalledWith({
      target: 'offscreen',
      jsonrpc: '2.0',
      id: null,
      method: 'pageMessage',
      params: aeppMessage,
    });
  });
});
