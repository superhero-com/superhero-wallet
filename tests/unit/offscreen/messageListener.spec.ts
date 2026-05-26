// @ts-nocheck
describe('offscreen message listener', () => {
  const discoverAccountsMock = jest.fn();

  function mockOffscreenDependencies() {
    discoverAccountsMock.mockResolvedValue(['ledger-account']);

    jest.doMock('vue', () => ({
      watch: jest.fn(),
    }));
    jest.doMock('@/lib/initPolyfills', () => ({}));
    jest.doMock('@/protocols/registerAdapters', () => ({}));
    jest.doMock('@/constants', () => ({
      IS_FIREFOX: false,
      POPUP_METHODS: {
        reload: 'reload',
        ledgerDeriveAccount: 'ledgerDeriveAccount',
        ledgerDiscoverAccounts: 'ledgerDiscoverAccounts',
        ledgerSignTransaction: 'ledgerSignTransaction',
        ledgerSignMessage: 'ledgerSignMessage',
      },
      PROTOCOLS: { ethereum: 'ethereum' },
      EVM_PROTOCOLS: ['ethereum'],
    }));
    jest.doMock('@/composables', () => ({
      useWalletConnect: jest.fn(),
      useNetworks: () => ({
        activeNetworkName: { value: 'Mainnet' },
        networks: { value: {} },
      }),
      useLedger: () => ({
        deriveAccount: jest.fn(),
        discoverAccounts: discoverAccountsMock,
        signTransaction: jest.fn(),
        signMessage: jest.fn(),
      }),
      useAccounts: () => ({
        activeAccount: { value: { protocol: 'ethereum' } },
      }),
    }));
    jest.doMock('@/protocols/evm/libs/EvmRpcMethodsHandler', () => ({
      handleEvmRpcMethod: jest.fn(),
    }));
    jest.doMock('@/protocols/ethereum/config', () => ({
      ETH_RPC_WALLET_EVENTS: {
        chainChanged: 'chainChanged',
        accountsChanged: 'accountsChanged',
      },
    }));
    jest.doMock('@/background/utils', () => ({
      registerInPageContentScript: jest.fn(),
      updateDynamicRules: jest.fn(),
    }));
    jest.doMock('@/offscreen/wallet', () => ({
      init: jest.fn(),
      disconnect: jest.fn(),
    }));
  }

  function loadListener() {
    jest.isolateModules(() => {
      // eslint-disable-next-line global-require
      require('@/offscreen/offscreen');
    });

    return (
      (global as any).browser.runtime.onMessage.addListener as jest.Mock
    ).mock.calls[0][0];
  }

  beforeEach(() => {
    jest.resetModules();
    (global as any).browser = {
      runtime: {
        id: 'test-extension-id',
        onMessage: { addListener: jest.fn() },
        sendMessage: jest.fn(),
      },
      tabs: {
        query: jest.fn(),
        sendMessage: jest.fn(),
      },
    };
    mockOffscreenDependencies();
  });

  it.each([
    ['message for background', { target: 'background', method: 'accountsChanged' }],
    ['external sender', { target: 'offscreen', method: 'ledgerDiscoverAccounts' }, { id: 'other-extension-id' }],
  ])('does not claim ignored messages: %s', (_label, msg, sender = { id: 'test-extension-id' }) => {
    const listener = loadListener();

    expect(listener(msg, sender)).toBeUndefined();
  });

  it('does not claim accepted but unhandled offscreen messages', () => {
    const listener = loadListener();

    expect(listener(
      { target: 'offscreen', method: 'unknownMethod' },
      { id: 'test-extension-id' },
    )).toBeUndefined();
  });

  it('still returns responses for handled offscreen messages', async () => {
    const listener = loadListener();

    await expect(listener(
      { target: 'offscreen', method: 'ledgerDiscoverAccounts' },
      { id: 'test-extension-id' },
    )).resolves.toEqual(['ledger-account']);
  });
});
