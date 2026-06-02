// @ts-nocheck
describe('offscreen wallet connections', () => {
  let onConnectListener: vi.Mock;
  let disconnectListener: vi.Mock;
  let aeSdk: any;

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
      },
      onMessage: { addListener: vi.fn() },
    };
  }

  function mockDependencies() {
    onConnectListener = vi.fn();
    disconnectListener = vi.fn();
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

    (global as any).browser = {
      runtime: {
        id: 'test-extension-id',
        onConnect: {
          addListener: vi.fn((listener) => {
            onConnectListener = listener;
          }),
        },
        sendMessage: vi.fn(),
      },
      tabs: { reload: vi.fn() },
    };

    vi.doMock('webextension-polyfill', () => (global as any).browser, { virtual: true });
    vi.doMock('vue', () => ({ watch: vi.fn() }));
    vi.doMock('@/utils', () => ({ getCleanModalOptions: vi.fn((params) => params) }));
    vi.doMock('@aeternity/aepp-sdk', () => ({
      BrowserRuntimeConnection: vi.fn().mockImplementation(({ port }) => ({ port })),
    }));
    vi.doMock('@/background/bgPopupHandler', () => ({ setSessionTimeout: vi.fn() }));
    vi.doMock('@/composables', () => ({
      useAccounts: () => ({ activeAccount: { value: {} } }),
      useAeSdk: () => ({
        isAeSdkReady: { value: true },
        getAeSdk: vi.fn().mockResolvedValue(aeSdk),
        resetNode: vi.fn(),
      }),
      useAuth: () => ({ secureLoginTimeoutDecrypted: { value: '0' } }),
      useNetworks: () => ({ activeNetwork: { value: {} } }),
    }));
    vi.doMock('@/constants', () => ({
      CONNECTION_TYPES: {
        OTHER: 'OTHER',
        POPUP: 'POPUP',
        SESSION: 'SESSION',
      },
      IS_FIREFOX: false,
      POPUP_ACTIONS: { getProps: 'getProps' },
      SESSION_METHODS: { setSessionTimeout: 'setSessionTimeout' },
    }));
    vi.doMock('@/offscreen/popupHandler', () => ({
      getPopup: vi.fn(),
      removePopup: vi.fn(),
    }));
  }

  beforeEach(async () => {
    vi.resetModules();
    mockDependencies();
  });

  it('ignores sdk-owned client removal on port disconnect', async () => {
    let wallet: any;
    vi.resetModules();
      // eslint-disable-next-line global-require
      wallet = (await import('@/offscreen/wallet'));
    await wallet.init();
    await onConnectListener(createPort());

    aeSdk._clients.delete('client-id');

    expect(() => disconnectListener()).not.toThrow();
    expect(aeSdk.removeRpcClient).not.toHaveBeenCalled();
  });

  it('cleans up when sharing wallet info hits a disconnected port', async () => {
    const error = new Error('Attempting to use a disconnected port object');
    aeSdk.shareWalletInfo.mockRejectedValueOnce(error);

    let wallet: any;
    vi.resetModules();
      // eslint-disable-next-line global-require
      wallet = (await import('@/offscreen/wallet'));
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

    let wallet: any;
    vi.resetModules();
      // eslint-disable-next-line global-require
      wallet = (await import('@/offscreen/wallet'));
    await wallet.init();
    await onConnectListener(createPort());

    expect(() => disconnectListener()).not.toThrow();
    expect(aeSdk.removeRpcClient).toHaveBeenCalledWith('client-id');
  });

  it('re-throws unexpected errors thrown by removeRpcClient on disconnect', async () => {
    const error = new Error('something completely unexpected');
    aeSdk._clients.has = vi.fn(() => true);
    aeSdk.removeRpcClient.mockImplementation(() => { throw error; });

    let wallet: any;
    vi.resetModules();
      // eslint-disable-next-line global-require
      wallet = (await import('@/offscreen/wallet'));
    await wallet.init();
    await onConnectListener(createPort());

    expect(() => disconnectListener()).toThrow('something completely unexpected');
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

      let wallet: any;
      vi.resetModules();
        // eslint-disable-next-line global-require
        wallet = (await import('@/offscreen/wallet'));
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

      let wallet: any;
      vi.resetModules();
        // eslint-disable-next-line global-require
        wallet = (await import('@/offscreen/wallet'));
      await wallet.init();

      await expect(wallet.disconnect()).resolves.toBeUndefined();
      expect(aeSdk.removeRpcClient).toHaveBeenCalledWith('client-id');
    });

    it('re-throws unexpected errors from connection.sendMessage', async () => {
      const sendMessage = vi.fn(() => { throw new Error('boom'); });
      setupConnectedClient({ sendMessage });

      let wallet: any;
      vi.resetModules();
        // eslint-disable-next-line global-require
        wallet = (await import('@/offscreen/wallet'));
      await wallet.init();

      await expect(wallet.disconnect()).rejects.toThrow('boom');
    });
  });
});
