// @ts-nocheck
describe('offscreen wallet connections', () => {
  let onConnectListener: jest.Mock;
  let disconnectListener: jest.Mock;
  let aeSdk: any;

  function createPort() {
    return {
      name: '',
      sender: {
        id: 'test-extension-id',
        url: 'https://dapp.example',
      },
      onDisconnect: {
        addListener: jest.fn((listener) => {
          disconnectListener = listener;
        }),
      },
      onMessage: { addListener: jest.fn() },
    };
  }

  function mockDependencies() {
    onConnectListener = jest.fn();
    disconnectListener = jest.fn();
    aeSdk = {
      _clients: new Map([['client-id', {}]]),
      addRpcClient: jest.fn(() => 'client-id'),
      removeRpcClient: jest.fn((clientId) => {
        if (!aeSdk._clients.has(clientId)) {
          throw new Error(`RpcClient with id ${clientId} do not exist`);
        }
        aeSdk._clients.delete(clientId);
      }),
      shareWalletInfo: jest.fn().mockResolvedValue(undefined),
      _pushAccountsToApps: jest.fn(),
    };

    (global as any).browser = {
      runtime: {
        id: 'test-extension-id',
        onConnect: {
          addListener: jest.fn((listener) => {
            onConnectListener = listener;
          }),
        },
        sendMessage: jest.fn(),
      },
      tabs: { reload: jest.fn() },
    };

    jest.doMock('webextension-polyfill', () => (global as any).browser, { virtual: true });
    jest.doMock('vue', () => ({ watch: jest.fn() }));
    jest.doMock('@/utils', () => ({ getCleanModalOptions: jest.fn((params) => params) }));
    jest.doMock('@aeternity/aepp-sdk', () => ({
      BrowserRuntimeConnection: jest.fn().mockImplementation(({ port }) => ({ port })),
    }));
    jest.doMock('@/background/bgPopupHandler', () => ({ setSessionTimeout: jest.fn() }));
    jest.doMock('@/composables', () => ({
      useAccounts: () => ({ activeAccount: { value: {} } }),
      useAeSdk: () => ({
        isAeSdkReady: { value: true },
        getAeSdk: jest.fn().mockResolvedValue(aeSdk),
        resetNode: jest.fn(),
      }),
      useAuth: () => ({ secureLoginTimeoutDecrypted: { value: '0' } }),
      useNetworks: () => ({ activeNetwork: { value: {} } }),
    }));
    jest.doMock('@/constants', () => ({
      CONNECTION_TYPES: {
        OTHER: 'OTHER',
        POPUP: 'POPUP',
        SESSION: 'SESSION',
      },
      IS_FIREFOX: false,
      POPUP_ACTIONS: { getProps: 'getProps' },
      SESSION_METHODS: { setSessionTimeout: 'setSessionTimeout' },
    }));
    jest.doMock('@/offscreen/popupHandler', () => ({
      getPopup: jest.fn(),
      removePopup: jest.fn(),
    }));
  }

  beforeEach(() => {
    jest.resetModules();
    mockDependencies();
  });

  it('ignores sdk-owned client removal on port disconnect', async () => {
    let wallet: any;
    jest.isolateModules(() => {
      // eslint-disable-next-line global-require
      wallet = require('@/offscreen/wallet');
    });
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
    jest.isolateModules(() => {
      // eslint-disable-next-line global-require
      wallet = require('@/offscreen/wallet');
    });
    await wallet.init();
    await expect(onConnectListener(createPort())).resolves.toBeUndefined();

    expect(aeSdk.removeRpcClient).toHaveBeenCalledWith('client-id');
  });

  it('swallows expected errors thrown by removeRpcClient (catch-path safety net)', async () => {
    const error: any = new Error('RpcClient with id client-id do not exist');
    error.name = 'UnknownRpcClientError';
    // Force the has() guard to pass so we actually reach the throwing call.
    aeSdk._clients.has = jest.fn(() => true);
    aeSdk.removeRpcClient.mockImplementation(() => { throw error; });

    let wallet: any;
    jest.isolateModules(() => {
      // eslint-disable-next-line global-require
      wallet = require('@/offscreen/wallet');
    });
    await wallet.init();
    await onConnectListener(createPort());

    expect(() => disconnectListener()).not.toThrow();
    expect(aeSdk.removeRpcClient).toHaveBeenCalledWith('client-id');
  });

  it('re-throws unexpected errors thrown by removeRpcClient on disconnect', async () => {
    const error = new Error('something completely unexpected');
    aeSdk._clients.has = jest.fn(() => true);
    aeSdk.removeRpcClient.mockImplementation(() => { throw error; });

    let wallet: any;
    jest.isolateModules(() => {
      // eslint-disable-next-line global-require
      wallet = require('@/offscreen/wallet');
    });
    await wallet.init();
    await onConnectListener(createPort());

    expect(() => disconnectListener()).toThrow('something completely unexpected');
  });

  describe('disconnect()', () => {
    function setupConnectedClient(overrides: Partial<{
      sendMessage: jest.Mock;
      disconnect: jest.Mock;
      status: string;
    }> = {}) {
      const sendMessage = overrides.sendMessage ?? jest.fn();
      const disconnect = overrides.disconnect ?? jest.fn();
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
      const sendMessage = jest.fn(() => {
        throw new Error('Attempting to use a disconnected port object');
      });
      setupConnectedClient({ sendMessage });

      let wallet: any;
      jest.isolateModules(() => {
        // eslint-disable-next-line global-require
        wallet = require('@/offscreen/wallet');
      });
      await wallet.init();

      await expect(wallet.disconnect()).resolves.toBeUndefined();
      expect(sendMessage).toHaveBeenCalled();
      expect(aeSdk.removeRpcClient).toHaveBeenCalledWith('client-id');
    });

    it('ignores expected errors thrown by removeRpcClient', async () => {
      setupConnectedClient({ status: 'DISCONNECTED' });
      const error: any = new Error('RpcClient with id client-id do not exist');
      error.name = 'UnknownRpcClientError';
      aeSdk._clients.has = jest.fn(() => true);
      aeSdk.removeRpcClient.mockImplementation(() => { throw error; });

      let wallet: any;
      jest.isolateModules(() => {
        // eslint-disable-next-line global-require
        wallet = require('@/offscreen/wallet');
      });
      await wallet.init();

      await expect(wallet.disconnect()).resolves.toBeUndefined();
      expect(aeSdk.removeRpcClient).toHaveBeenCalledWith('client-id');
    });

    it('re-throws unexpected errors from connection.sendMessage', async () => {
      const sendMessage = jest.fn(() => { throw new Error('boom'); });
      setupConnectedClient({ sendMessage });

      let wallet: any;
      jest.isolateModules(() => {
        // eslint-disable-next-line global-require
        wallet = require('@/offscreen/wallet');
      });
      await wallet.init();

      await expect(wallet.disconnect()).rejects.toThrow('boom');
    });
  });
});
