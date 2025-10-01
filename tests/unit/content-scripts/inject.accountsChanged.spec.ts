// @ts-nocheck
/* eslint-disable global-require */
describe('inject.ts accountsChanged propagation', () => {
  let originalWindow: any;
  let postMessageSpy: jest.Mock;

  beforeEach(() => {
    jest.resetModules();
    originalWindow = global.window;
    postMessageSpy = jest.fn();

    // Mock a connected dapp mapping by simulating a prior RPC request from a given origin
    const fakeSource = { postMessage: postMessageSpy } as any;

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

    // Spy on addEventListener to capture registered runtime.onMessage listener
    addEventListenerSpy = jest.spyOn(global, 'addEventListener' as any);

    // Set up window and load inject.ts which registers listeners
    (global as any).window = Object.assign(new (class { } as any)(), {
      addEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
      origin: 'https://app.uniswap.org',
      // simulate one request from origin to register connectedDapps
      postMessage: jest.fn(),
    });

    // Load script
    // eslint-disable-next-line global-require, import/extensions
    jest.isolateModules(() => { require('@/content-scripts/inject.ts'); });

    // Simulate an RPC request that will store the source under connectedDapps
    const messageHandler = (window.addEventListener as jest.Mock).mock.calls.find((c) => c[0] === 'message')[1];
    (global as any).__fakeSource = fakeSource; // keep ref
    // Await the async handler to ensure connectedDapps is populated
    return Promise.resolve().then(() => messageHandler({
      data: { method: 'eth_chainId', params: [] },
      origin: 'https://app.uniswap.org',
      source: fakeSource,
    }));
  });

  afterEach(() => {
    (global as any).window = originalWindow;
  });

  it('forwards accountsChanged to connected dapp source', async () => {
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
      && args[1] === 'https://app.uniswap.org'
    ));
    expect(found).toBe(true);
  });
});
