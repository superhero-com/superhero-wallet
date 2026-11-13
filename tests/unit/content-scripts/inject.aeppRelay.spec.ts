import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import {
  BrowserRuntimeConnection,
  BrowserWindowMessageConnection,
  MESSAGE_DIRECTION,
  connectionProxy,
} from '@aeternity/aepp-sdk';

type Listener = (...args: any[]) => void;

function createPort() {
  const messageListeners = new Set<Listener>();
  const disconnectListeners = new Set<Listener>();
  const port = {
    postMessage: vi.fn(),
    disconnect: vi.fn(),
    onMessage: {
      addListener: (listener: Listener) => messageListeners.add(listener),
      removeListener: (listener: Listener) => messageListeners.delete(listener),
    },
    onDisconnect: {
      addListener: (listener: Listener) => disconnectListeners.add(listener),
      removeListener: (listener: Listener) => disconnectListeners.delete(listener),
    },
    /** A message of the wallet */
    receive: (message: unknown) => messageListeners.forEach((listener) => listener(message, port)),
    close: () => disconnectListeners.forEach((listener) => listener(port)),
  };
  return port;
}

type Port = ReturnType<typeof createPort>;

/**
 * The relay must do what the SDK's connection proxy did, which aepps and the
 * wallet's own SDK connection rely on.
 */
describe('inject.ts aepp relay', () => {
  let readyState: DocumentReadyState;
  let ports: Port[];
  let sdkPort: Port | undefined;

  async function loadInject() {
    vi.resetModules();
    await import('@/content-scripts/inject');
  }

  /** The proxy inject.ts set up before, on a port of its own */
  function startSdkRelay() {
    sdkPort = createPort();
    connectionProxy(
      new BrowserWindowMessageConnection({
        target: window,
        origin: window.origin,
        sendDirection: MESSAGE_DIRECTION.to_aepp,
        receiveDirection: MESSAGE_DIRECTION.to_waellet,
      }),
      new BrowserRuntimeConnection({ port: sdkPort as any, debug: false }),
    );
  }

  const injectPort = () => ports[0];

  function setReadyState(state: DocumentReadyState) {
    readyState = state;
    document.dispatchEvent(new Event('readystatechange'));
  }

  function postFromPage(
    data: unknown,
    { origin = window.origin, source = window }: { origin?: string; source?: Window | null } = {},
  ) {
    window.dispatchEvent(new MessageEvent('message', { data, origin, source }));
  }

  beforeEach(() => {
    ports = [];
    sdkPort = undefined;
    readyState = 'complete';
    vi.spyOn(document, 'readyState', 'get').mockImplementation(() => readyState);
    (globalThis as any).browser = {
      runtime: {
        getURL: (path: string) => `chrome-extension://extension-id/${path}`,
        onMessage: { addListener: vi.fn() },
        sendMessage: vi.fn().mockResolvedValue({}),
        connect: vi.fn(() => {
          const port = createPort();
          ports.push(port);
          return port;
        }),
      },
    };
    vi.doMock('webextension-polyfill', () => ({ default: (globalThis as any).browser }));
  });

  afterEach(() => {
    // Takes this test's relays off the window
    ports.forEach((port) => port.close());
    sdkPort?.close();
    vi.restoreAllMocks();
  });

  describe('start', () => {
    it('waits until the page has loaded, and starts once', async () => {
      readyState = 'loading';
      await loadInject();
      setReadyState('interactive');
      expect(ports).toHaveLength(0);

      setReadyState('complete');
      expect(ports).toHaveLength(1);

      // E.g. after `document.open()`
      setReadyState('loading');
      setReadyState('complete');
      expect(ports).toHaveLength(1);
    });

    it('starts at once on a page that has loaded', async () => {
      await loadInject();
      expect(ports).toHaveLength(1);
    });
  });

  describe('as the SDK connection proxy', () => {
    const request = {
      jsonrpc: '2.0', id: 1, method: 'connection.open', params: { name: 'aepp', version: 1 },
    };
    const toWallet = (data: unknown) => ({ type: MESSAGE_DIRECTION.to_waellet, data });
    const evmAnswer = {
      jsonrpc: '2.0', superheroWalletApproved: true, type: 'result', result: [], requestId: 1,
    };
    const pageMessages: [string, unknown, { origin?: string; source?: null }, boolean][] = [
      ['a request to the wallet', toWallet(request), {}, true],
      ['an untyped request', request, {}, true],
      ['a request typed at its top', { ...toWallet({ id: 2 }), jsonrpc: '2.0' }, {}, true],
      ['a message to the aepp', { type: MESSAGE_DIRECTION.to_aepp, data: request }, {}, false],
      ['an answer of the EVM provider', evmAnswer, {}, false],
      ['a message without jsonrpc', toWallet({ id: 3 }), {}, false],
      ['another jsonrpc version', toWallet({ ...request, jsonrpc: '1.0' }), {}, false],
      ['a string', JSON.stringify(request), {}, false],
      ['another origin', toWallet(request), { origin: 'https://other.example' }, false],
      ['another source', toWallet(request), { source: null }, false],
    ];

    it.each(pageMessages)('treats %s as the SDK did', async (_, data, from, isForwarded) => {
      await loadInject();
      startSdkRelay();

      postFromPage(data, from);

      expect(injectPort().postMessage.mock.calls).toEqual(sdkPort!.postMessage.mock.calls);
      expect(injectPort().postMessage).toHaveBeenCalledTimes(isForwarded ? 1 : 0);
    });

    it('ignores `null`, where the SDK threw', async () => {
      await loadInject();
      expect(() => postFromPage(null)).not.toThrow();
      expect(injectPort().postMessage).not.toHaveBeenCalled();
    });

    it('posts messages of the wallet to the page the same', async () => {
      const windowPostMessage = vi.spyOn(window, 'postMessage').mockImplementation(() => {});
      await loadInject();
      startSdkRelay();
      const response = { jsonrpc: '2.0', id: 1, result: { id: 'superhero' } };

      sdkPort!.receive(response);
      const sdkPosts = [...windowPostMessage.mock.calls];
      windowPostMessage.mockClear();
      injectPort().receive(response);

      expect(windowPostMessage.mock.calls).toEqual(sdkPosts);
      expect(windowPostMessage).toHaveBeenCalledWith(
        { type: MESSAGE_DIRECTION.to_aepp, data: response },
        window.origin,
      );
    });

    it('stops forwarding once the wallet disconnects', async () => {
      await loadInject();
      startSdkRelay();

      injectPort().close();
      sdkPort!.close();
      postFromPage(toWallet(request));

      expect(injectPort().postMessage).not.toHaveBeenCalled();
      expect(sdkPort!.postMessage).not.toHaveBeenCalled();
    });
  });

  describe('on a page restored from the back/forward cache', () => {
    const request = {
      type: MESSAGE_DIRECTION.to_waellet,
      data: { jsonrpc: '2.0', id: 1, method: 'message.sign' },
    };
    const sessionEnd = {
      type: 'to_aepp',
      data: { jsonrpc: '2.0', method: 'connection.close', params: { reason: 'bye' } },
    };
    let windowPostMessage: ReturnType<typeof vi.spyOn>;

    function showPage(persisted: boolean) {
      window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted }));
    }

    beforeEach(async () => {
      windowPostMessage = vi.spyOn(window, 'postMessage').mockImplementation(() => {});
      await loadInject();
    });

    it('relays through a new port, as Chrome closed the old one', () => {
      showPage(true);
      postFromPage(request);
      ports[1].receive({ jsonrpc: '2.0', id: 1, result: 'signature' });

      expect(ports).toHaveLength(2);
      expect(ports[0].disconnect).toHaveBeenCalled();
      expect(ports[0].postMessage).not.toHaveBeenCalled();
      expect(ports[1].postMessage).toHaveBeenCalledWith(request.data);
      expect(windowPostMessage).toHaveBeenCalledWith(
        { type: 'to_aepp', data: { jsonrpc: '2.0', id: 1, result: 'signature' } },
        window.origin,
      );
    });

    it('tells the aepp its session ended', () => {
      postFromPage(request);
      showPage(true);

      expect(windowPostMessage).toHaveBeenCalledWith(sessionEnd, window.origin);
    });

    it('tells nothing to a page that did not talk to the wallet', () => {
      showPage(true);

      expect(ports).toHaveLength(2);
      expect(windowPostMessage).not.toHaveBeenCalled();
    });

    it('tells the aepp again when restored again', () => {
      postFromPage(request);
      showPage(true);
      postFromPage(request);
      showPage(true);

      expect(ports).toHaveLength(3);
      expect(windowPostMessage.mock.calls).toEqual([
        [sessionEnd, window.origin],
        [sessionEnd, window.origin],
      ]);
    });

    it('keeps the port of a page shown for the first time', () => {
      postFromPage(request);
      showPage(false);

      expect(ports).toHaveLength(1);
      expect(windowPostMessage).not.toHaveBeenCalled();
    });

    it('stays off once the wallet has disconnected, as after an update', () => {
      ports[0].close();
      showPage(true);
      postFromPage(request);

      expect(ports).toHaveLength(1);
      expect(ports[0].postMessage).not.toHaveBeenCalled();
    });

    it('keeps the port in Firefox, which leaves it open', () => {
      (globalThis as any).browser.runtime.getURL = (path: string) => `moz-extension://uuid/${path}`;
      postFromPage(request);
      showPage(true);
      postFromPage(request);

      expect(ports).toHaveLength(1);
      expect(ports[0].disconnect).not.toHaveBeenCalled();
      expect(ports[0].postMessage).toHaveBeenCalledTimes(2);
      expect(windowPostMessage).not.toHaveBeenCalled();
    });
  });
});
