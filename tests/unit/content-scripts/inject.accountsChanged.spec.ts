// @ts-nocheck
/* eslint-disable global-require */
describe('inject.ts accountsChanged propagation', () => {
  let postMessageSpy: vi.Mock;
  let origin: string;

  beforeEach(async () => {
    vi.resetModules();
    postMessageSpy = vi.fn();
    origin = window.location.origin;

    // Mock browser runtime and resolve require path
    // @ts-expect-error
    (global as any).browser = {
      runtime: {
        onMessage: { addListener: vi.fn() },
        sendMessage: vi.fn().mockResolvedValue({}),
        connect: vi.fn(() => ({
          onMessage: { addListener: vi.fn() },
          onDisconnect: { addListener: vi.fn() },
          postMessage: vi.fn(),
        })),
      },
    };
    vi.doMock('webextension-polyfill', () => ({ default: (global as any).browser }), { virtual: true });

    // Isolate inject.ts's own window-message handler: stub out the aepp-sdk
    // connection proxy so it doesn't register a competing 'message' listener.
    vi.doMock('@aeternity/aepp-sdk', async () => ({
      ...(await vi.importActual('@aeternity/aepp-sdk')),
      BrowserRuntimeConnection: vi.fn(),
      BrowserWindowMessageConnection: vi.fn(),
      connectionProxy: vi.fn(),
    }));

    vi.spyOn(window, 'addEventListener');
    vi.spyOn(window, 'postMessage').mockImplementation(postMessageSpy);

    // inject.ts polls `document.readyState` via setInterval at module load.
    // These tests don't exercise that path, and a leaked interval would fire
    // after the jsdom environment is torn down (`document is not defined`),
    // crashing the worker. Stub it out so no real timer is scheduled.
    vi.spyOn(global, 'setInterval').mockReturnValue(0 as unknown as ReturnType<typeof setInterval>);

    // Load script
    vi.resetModules();
    await import('@/content-scripts/inject');
  });

  afterEach(async () => {
    vi.restoreAllMocks();
  });

  const flushPromises = () => new Promise((resolve) => { setTimeout(resolve); });

  /** The page asks the wallet, which answers with `response` */
  async function pageRequest(method: string, response: object) {
    ((global as any).browser.runtime.sendMessage as vi.Mock).mockResolvedValueOnce(response);
    const messageHandler = (window.addEventListener as vi.Mock).mock.calls.find((c) => c[0] === 'message')[1];
    await messageHandler({
      data: { method, params: [] },
      origin,
      source: window,
    });
    await flushPromises();
  }

  async function emitWalletEvent(method: string, result: unknown) {
    const runtimeListener = ((global as any).browser.runtime.onMessage.addListener as vi.Mock)
      .mock.calls[0][0];
    await runtimeListener({ method, result });
    await flushPromises();
  }

  /** The accounts the wallet gives the page when asked after a change */
  function permitAccounts(accounts: string[]) {
    ((global as any).browser.runtime.sendMessage as vi.Mock)
      .mockResolvedValueOnce({ result: accounts });
  }

  const getPostedEvents = (method: string) => postMessageSpy.mock.calls
    .filter(([data]) => data?.method === method);

  it.each([
    ['eth_requestAccounts'],
    ['eth_accounts'],
  ])('forwards accountsChanged to a page that got accounts from %s', async (method) => {
    await pageRequest(method, { result: ['0xabc'] });

    permitAccounts(['0xdef']);
    await emitWalletEvent('accountsChanged', ['0xdef']);

    expect(getPostedEvents('accountsChanged')).toEqual([[
      expect.objectContaining({ result: ['0xdef'], superheroWalletApproved: true, type: 'result' }),
      origin,
    ]]);
    expect((global as any).browser.runtime.sendMessage).toHaveBeenLastCalledWith(
      expect.objectContaining({ method: 'superhero_getPermittedAccounts', params: {} }),
    );
  });

  it('forwards the accounts the page is permitted, not the ones of the event', async () => {
    await pageRequest('eth_accounts', { result: ['0xabc'] });

    permitAccounts(['0xabc']);
    await emitWalletEvent('accountsChanged', ['0xdef']);

    expect(getPostedEvents('accountsChanged').map(([data]) => data.result)).toEqual([['0xabc']]);
  });

  it('tells a page removed from the connected sites once, then stops', async () => {
    await pageRequest('eth_requestAccounts', { result: ['0xabc'] });

    permitAccounts([]);
    await emitWalletEvent('accountsChanged', ['0xdef']);
    await emitWalletEvent('accountsChanged', ['0x123']);

    expect(getPostedEvents('accountsChanged').map(([data]) => data.result)).toEqual([[]]);
  });

  it('tells a page no accounts when the wallet does not answer which it is permitted', async () => {
    await pageRequest('eth_requestAccounts', { result: ['0xabc'] });

    ((global as any).browser.runtime.sendMessage as vi.Mock).mockResolvedValueOnce(undefined);
    await emitWalletEvent('accountsChanged', ['0xdef']);

    expect(getPostedEvents('accountsChanged').map(([data]) => data.result)).toEqual([[]]);
  });

  it.each([
    ['only asked for the chain id', [
      ['eth_chainId', { result: '0x1' }],
    ]],
    ['got no accounts', [
      ['eth_accounts', { result: [] }],
    ]],
    ['was refused the accounts', [
      ['eth_requestAccounts', { error: { code: 4001, message: 'User have rejected the request' } }],
    ]],
    ['revoked its permissions', [
      ['eth_requestAccounts', { result: ['0xabc'] }],
      ['wallet_revokePermissions', { result: null }],
    ]],
  ])('does not forward accountsChanged to a page that %s', async (_label, requests) => {
    // eslint-disable-next-line no-restricted-syntax
    for (const [method, response] of requests) {
      // eslint-disable-next-line no-await-in-loop
      await pageRequest(method, response);
    }

    await emitWalletEvent('accountsChanged', ['0xdef']);

    expect(getPostedEvents('accountsChanged')).toHaveLength(0);
  });

  it('forwards chainChanged to a page without accounts', async () => {
    await pageRequest('eth_chainId', { result: '0x1' });

    await emitWalletEvent('chainChanged', '0x38');

    expect(getPostedEvents('chainChanged')).toEqual([[
      expect.objectContaining({ result: '0x38', superheroWalletApproved: true, type: 'result' }),
      origin,
    ]]);
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
      source: { postMessage: vi.fn() },
    })],
    ['the method only the content script asks, as an EVM request', () => ({
      data: { superheroWalletRequest: true, method: 'superhero_getPermittedAccounts', params: [] },
      origin,
      source: window,
    })],
    ['the method only the content script asks', () => ({
      data: { method: 'superhero_getPermittedAccounts', aepp: origin },
      origin,
      source: window,
    })],
    ['a method that is not a string', () => ({
      // eslint-disable-next-line no-new-wrappers
      data: { method: new String('eth_requestAccounts'), aepp: 'https://aescan.io' },
      origin,
      source: window,
    })],
  ])('does not forward page requests from %s', async (_label, createEvent) => {
    const messageHandler = (window.addEventListener as vi.Mock).mock.calls.find((c) => c[0] === 'message')[1];
    ((global as any).browser.runtime.sendMessage as vi.Mock).mockClear();

    await messageHandler(createEvent());

    expect((global as any).browser.runtime.sendMessage).not.toHaveBeenCalled();
  });

  it('forwards the params of an EVM request as the page sent them', async () => {
    const messageHandler = (window.addEventListener as vi.Mock).mock.calls.find((c) => c[0] === 'message')[1];
    ((global as any).browser.runtime.sendMessage as vi.Mock).mockClear();
    const params = ['0x68656c6c6f', '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826'];

    await messageHandler({
      data: {
        superheroWalletRequest: true, method: 'personal_sign', params, requestId: 1,
      },
      origin,
      source: window,
    });

    expect((global as any).browser.runtime.sendMessage).toHaveBeenCalledWith({
      target: 'offscreen',
      jsonrpc: '2.0',
      id: null,
      method: 'personal_sign',
      params: { rpcMethodParams: params, aepp: origin },
    });
  });

  it('forwards aepp SDK page messages to the offscreen document', async () => {
    const messageHandler = (window.addEventListener as vi.Mock).mock.calls.find((c) => c[0] === 'message')[1];
    ((global as any).browser.runtime.sendMessage as vi.Mock).mockClear();

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
