// @ts-nocheck
import { nextTick, ref } from 'vue';
import { CONNECTION_TYPES } from '@/constants';

describe('offscreen wallet connections', () => {
  let onConnectListener: vi.Mock;
  let disconnectListener: vi.Mock;
  let messageListener: vi.Mock;
  let syncBackgroundEncryptionKey: vi.Mock;
  let addSidePanel: vi.Mock;
  let aeSdk: any;
  let aeSdkComposable: any;
  let activeNetwork;

  function createPort() {
    return {
      name: '',
      sender: {
        id: 'test-extension-id',
        url: 'https://dapp.example',
      },
      onDisconnect: {
        addListener: vi.fn((listener) => {
          disconnectListener = listener;
        }),
        removeListener: vi.fn(),
      },
      onMessage: {
        addListener: vi.fn((listener) => {
          messageListener = listener;
        }),
      },
    };
  }

  function mockDependencies() {
    onConnectListener = vi.fn();
    disconnectListener = vi.fn();
    messageListener = vi.fn();
    syncBackgroundEncryptionKey = vi.fn();
    addSidePanel = vi.fn();
    activeNetwork = ref({});
    aeSdk = {
      _clients: new Map([['client-id', {}]]),
      addRpcClient: vi.fn(() => 'client-id'),
      removeRpcClient: vi.fn((clientId) => {
        if (!aeSdk._clients.has(clientId)) {
          throw new Error(`RpcClient with id ${clientId} do not exist`);
        }
        aeSdk._clients.delete(clientId);
      }),
      shareWalletInfo: vi.fn().mockResolvedValue(undefined),
      _pushAccountsToApps: vi.fn(),
    };
    aeSdkComposable = {
      isAeSdkReady: { value: true },
      getAeSdk: vi.fn().mockResolvedValue(aeSdk),
      resetNode: vi.fn(),
    };

    (global as any).browser = {
      runtime: {
        id: 'test-extension-id',
        getURL: (path: string) => `chrome-extension://test-extension-id/${path}`,
        onConnect: {
          addListener: vi.fn((listener) => {
            onConnectListener = listener;
          }),
        },
        sendMessage: vi.fn(),
      },
      tabs: { reload: vi.fn() },
    };

    vi.doMock('webextension-polyfill', () => ({ default: (global as any).browser }), { virtual: true });
    vi.doMock('@/utils', () => ({ getCleanModalOptions: vi.fn((params) => params) }));
    vi.doMock('@aeternity/aepp-sdk', () => ({
      // Production code calls `new BrowserRuntimeConnection(...)`. Vitest 4 invokes
      // mock implementations with construct semantics, so the implementation must be
      // a constructable function (an arrow function is not).
      BrowserRuntimeConnection: vi.fn().mockImplementation(function BrowserRuntimeConnection(
        this: any,
        { port }: any,
      ) {
        this.port = port;
      }),
    }));
    vi.doMock('@/background/bgPopupHandler', () => ({ setSessionTimeout: vi.fn() }));
    vi.doMock('@/composables', () => ({
      useAccounts: () => ({ activeAccount: ref({}) }),
      useAeSdk: () => aeSdkComposable,
      useAuth: () => ({
        secureLoginTimeoutDecrypted: { value: '0' },
        syncBackgroundEncryptionKey,
      }),
      useNetworks: () => ({ activeNetwork }),
    }));
    vi.doMock('@/constants', async () => ({
      ...(await vi.importActual('@/constants')),
      IS_FIREFOX: false,
    }));
    vi.doMock('@/offscreen/popupHandler', () => ({
      addSidePanel,
      getPopup: vi.fn(),
      removePopup: vi.fn(),
    }));
  }

  beforeEach(async () => {
    vi.resetModules();
    mockDependencies();
  });

  it('ignores sdk-owned client removal on port disconnect', async () => {
    const wallet = (await import('@/offscreen/wallet'));
    await wallet.init();
    await onConnectListener(createPort());

    aeSdk._clients.delete('client-id');

    expect(() => disconnectListener()).not.toThrow();
    expect(aeSdk.removeRpcClient).not.toHaveBeenCalled();
  });

  it('cleans up when sharing wallet info hits a disconnected port', async () => {
    const error = new Error('Attempting to use a disconnected port object');
    aeSdk.shareWalletInfo.mockRejectedValueOnce(error);

    const wallet = (await import('@/offscreen/wallet'));
    await wallet.init();
    await expect(onConnectListener(createPort())).resolves.toBeUndefined();

    expect(aeSdk.removeRpcClient).toHaveBeenCalledWith('client-id');
  });

  it('swallows expected errors thrown by removeRpcClient (catch-path safety net)', async () => {
    const error: any = new Error('RpcClient with id client-id do not exist');
    error.name = 'UnknownRpcClientError';
    // Force the has() guard to pass so we actually reach the throwing call.
    aeSdk._clients.has = vi.fn(() => true);
    aeSdk.removeRpcClient.mockImplementation(() => { throw error; });

    const wallet = (await import('@/offscreen/wallet'));
    await wallet.init();
    await onConnectListener(createPort());

    expect(() => disconnectListener()).not.toThrow();
    expect(aeSdk.removeRpcClient).toHaveBeenCalledWith('client-id');
  });

  it('re-throws unexpected errors thrown by removeRpcClient on disconnect', async () => {
    const error = new Error('something completely unexpected');
    aeSdk._clients.has = vi.fn(() => true);
    aeSdk.removeRpcClient.mockImplementation(() => { throw error; });

    const wallet = (await import('@/offscreen/wallet'));
    await wallet.init();
    await onConnectListener(createPort());

    expect(() => disconnectListener()).toThrow('something completely unexpected');
  });

  describe('while the SDK is updating', () => {
    it('connects an aepp whose port arrives during a node reset once the reset is done', async () => {
      const wallet = (await import('@/offscreen/wallet'));
      await wallet.init();

      // A node reset is running: `getAeSdk` only resolves once it is done.
      let finishReset;
      aeSdkComposable.isAeSdkReady.value = false;
      aeSdkComposable.getAeSdk.mockReturnValueOnce(
        new Promise((resolve) => { finishReset = resolve; }),
      );
      const connecting = onConnectListener(createPort());
      await Promise.resolve();
      expect(aeSdk.addRpcClient).not.toHaveBeenCalled();

      aeSdkComposable.isAeSdkReady.value = true;
      finishReset(aeSdk);
      await connecting;

      expect(aeSdk.addRpcClient).toHaveBeenCalledTimes(1);
      expect(aeSdk.shareWalletInfo).toHaveBeenCalledWith('client-id');
    });

    it('does not add an aepp whose port closed while waiting for the SDK', async () => {
      const wallet = (await import('@/offscreen/wallet'));
      await wallet.init();
      let finishReset;
      aeSdkComposable.getAeSdk.mockReturnValueOnce(
        new Promise((resolve) => { finishReset = resolve; }),
      );

      const connecting = onConnectListener(createPort());
      disconnectListener(); // the aepp tab reloads meanwhile
      finishReset(aeSdk);
      await connecting;

      expect(aeSdk.addRpcClient).not.toHaveBeenCalled();
      expect(aeSdk.shareWalletInfo).not.toHaveBeenCalled();
    });

    it('does not announce the wallet until the SDK is ready, then keeps retrying', async () => {
      vi.useFakeTimers();
      try {
        const wallet = (await import('@/offscreen/wallet'));
        await wallet.init();

        aeSdkComposable.isAeSdkReady.value = false;
        await onConnectListener(createPort());
        expect(aeSdk.addRpcClient).toHaveBeenCalledTimes(1);
        expect(aeSdk.shareWalletInfo).not.toHaveBeenCalled();

        aeSdkComposable.isAeSdkReady.value = true;
        await vi.advanceTimersByTimeAsync(3000);
        expect(aeSdk.shareWalletInfo).toHaveBeenCalledWith('client-id');
      } finally {
        vi.useRealTimers();
      }
    });

    it('passes every network change on to resetNode, even while a reset is running', async () => {
      const wallet = (await import('@/offscreen/wallet'));
      activeNetwork.value = { name: 'A' };
      await wallet.init();
      // Never-ending resets, so every change below arrives while one is running.
      aeSdkComposable.resetNode.mockReturnValue(new Promise(() => {}));

      activeNetwork.value = { name: 'B' };
      await nextTick();
      activeNetwork.value = { name: 'C' };
      await nextTick();
      activeNetwork.value = { name: 'C' }; // equal value: ignored
      await nextTick();

      expect(aeSdkComposable.resetNode.mock.calls).toEqual([[{ name: 'B' }], [{ name: 'C' }]]);
    });
  });

  describe('session port', () => {
    function createSessionPort() {
      const port = createPort();
      port.name = 'SESSION';
      port.sender.url = 'chrome-extension://test-extension-id/index.html';
      return port;
    }

    it('syncs the session key once the popup reports it stored, ignoring other messages', async () => {
      const { SESSION_METHODS } = await import('@/constants');
      const wallet = (await import('@/offscreen/wallet'));
      await wallet.init();
      await onConnectListener(createSessionPort());
      expect(syncBackgroundEncryptionKey).not.toHaveBeenCalled();

      messageListener({ method: SESSION_METHODS.sessionKeyStored });
      expect(syncBackgroundEncryptionKey).toHaveBeenCalledTimes(1);

      messageListener({ method: 'somethingElse' });
      messageListener(undefined);
      expect(syncBackgroundEncryptionKey).toHaveBeenCalledTimes(1);
    });

    it('still starts the session timeout when the popup closes', async () => {
      const { SESSION_METHODS } = await import('@/constants');
      const wallet = (await import('@/offscreen/wallet'));
      await wallet.init();
      await onConnectListener(createSessionPort());

      await disconnectListener();

      expect((global as any).browser.runtime.sendMessage).toHaveBeenCalledWith({
        target: 'background',
        method: SESSION_METHODS.setSessionTimeout,
        payload: 0,
      });
    });

    it('is not taken from a content script, which could keep the wallet unlocked', async () => {
      const wallet = (await import('@/offscreen/wallet'));
      await wallet.init();
      const port = createSessionPort();
      port.sender.url = 'https://dapp.example/';
      await onConnectListener(port);

      await disconnectListener();

      // Served as any other port of a web page
      expect(aeSdk.addRpcClient).toHaveBeenCalledOnce();
      expect((global as any).browser.runtime.sendMessage).not.toHaveBeenCalled();
    });
  });

  describe('side panel port', () => {
    async function connectSidePanelFrom(url: string) {
      const wallet = (await import('@/offscreen/wallet'));
      await wallet.init();
      const port = createPort();
      port.name = CONNECTION_TYPES.SIDE_PANEL;
      port.sender.url = url;
      await onConnectListener(port);
      return port;
    }

    it('is taken from the wallet page', async () => {
      const port = await connectSidePanelFrom('chrome-extension://test-extension-id/index.html?sidepanel');

      expect(addSidePanel).toHaveBeenCalledWith(port);
    });

    it('is taken as a dapp connection from a web page', async () => {
      await connectSidePanelFrom('https://dapp.example/');

      expect(addSidePanel).not.toHaveBeenCalled();
      expect(aeSdk.addRpcClient).toHaveBeenCalledOnce();
    });
  });

  describe('popup port', () => {
    let popupHandler;
    let popupCount;

    beforeEach(async () => {
      vi.doUnmock('@/offscreen/popupHandler');
      const extensionBrowser = (global as any).browser;
      const wallet = (await import('@/offscreen/wallet'));
      popupHandler = await import('@/offscreen/popupHandler');
      (global as any).browser = extensionBrowser;
      await wallet.init();

      popupCount = 0;
      extensionBrowser.runtime.sendMessage.mockImplementation(async ({ method }) => {
        if (method !== 'openPopup') return undefined;
        popupCount += 1;
        return { id: `popup-${popupCount}`, props: {} };
      });
    });

    async function openPopupWindow() {
      const id = `popup-${popupCount + 1}`;
      const request = popupHandler.openPopup('connect', 'https://dapp.example', {});
      await vi.waitFor(() => expect(popupHandler.getPopup(id)).toBeDefined());
      const port = createPort();
      port.name = CONNECTION_TYPES.POPUP;
      port.sender.url = `chrome-extension://test-extension-id/index.html?id=${id}`;
      port.postMessage = vi.fn();
      await onConnectListener(port);
      return {
        id, request, sendToOffscreen: messageListener, close: disconnectListener,
      };
    }

    it('rejects the request of a popup closed without an answer', async () => {
      const { id, request, close } = await openPopupWindow();
      const onRejected = vi.fn();
      request.catch(onRejected);

      close();
      await vi.waitFor(() => expect(onRejected).toHaveBeenCalled());
      expect(popupHandler.getPopup(id)).toBeUndefined();
    });

    it('keeps the answer of a popup that closes once answered', async () => {
      const {
        id, request, sendToOffscreen, close,
      } = await openPopupWindow();
      await sendToOffscreen({ type: 'resolve', payload: 'confirmed' });
      close();

      await expect(request).resolves.toBe('confirmed');
      expect(popupHandler.getPopup(id)).toBeUndefined();
    });
  });

  describe('disconnect()', () => {
    function setupConnectedClient(overrides: Partial<{
      sendMessage: vi.Mock;
      disconnect: vi.Mock;
      status: string;
    }> = {}) {
      const sendMessage = overrides.sendMessage ?? vi.fn();
      const disconnect = overrides.disconnect ?? vi.fn();
      const client = {
        status: overrides.status ?? 'CONNECTED',
        rpc: {
          connection: {
            sendMessage,
            disconnect,
            port: { sender: { tab: { id: 42 } } },
          },
        },
      };
      aeSdk._clients = new Map([['client-id', client]]);
      return { client, sendMessage, disconnect };
    }

    it('ignores expected errors thrown by connection.sendMessage / disconnect', async () => {
      const sendMessage = vi.fn(() => {
        throw new Error('Attempting to use a disconnected port object');
      });
      setupConnectedClient({ sendMessage });

      const wallet = (await import('@/offscreen/wallet'));
      await wallet.init();

      await expect(wallet.disconnect()).resolves.toBeUndefined();
      expect(sendMessage).toHaveBeenCalled();
      expect(aeSdk.removeRpcClient).toHaveBeenCalledWith('client-id');
    });

    it('ignores expected errors thrown by removeRpcClient', async () => {
      setupConnectedClient({ status: 'DISCONNECTED' });
      const error: any = new Error('RpcClient with id client-id do not exist');
      error.name = 'UnknownRpcClientError';
      aeSdk._clients.has = vi.fn(() => true);
      aeSdk.removeRpcClient.mockImplementation(() => { throw error; });

      vi.resetModules();
      const wallet = (await import('@/offscreen/wallet'));
      await wallet.init();

      await expect(wallet.disconnect()).resolves.toBeUndefined();
      expect(aeSdk.removeRpcClient).toHaveBeenCalledWith('client-id');
    });

    it('re-throws unexpected errors from connection.sendMessage', async () => {
      const sendMessage = vi.fn(() => { throw new Error('boom'); });
      setupConnectedClient({ sendMessage });

      const wallet = (await import('@/offscreen/wallet'));
      await wallet.init();

      await expect(wallet.disconnect()).rejects.toThrow('boom');
    });
  });
});
