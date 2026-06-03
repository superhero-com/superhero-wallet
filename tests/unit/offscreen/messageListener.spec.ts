// @ts-nocheck
describe('offscreen message listener', () => {
  const discoverAccountsMock = vi.fn();

  function mockOffscreenDependencies() {
    discoverAccountsMock.mockResolvedValue(['ledger-account']);

    vi.doMock('vue', () => ({
      watch: vi.fn(),
    }));
    vi.doMock('@/lib/initPolyfills', () => ({}));
    vi.doMock('@/protocols/registerAdapters', () => ({}));
    vi.doMock('@/constants', () => ({
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
    vi.doMock('@/composables', () => ({
      useWalletConnect: vi.fn(),
      useNetworks: () => ({
        activeNetworkName: { value: 'Mainnet' },
        networks: { value: {} },
      }),
      useLedger: () => ({
        deriveAccount: vi.fn(),
        discoverAccounts: discoverAccountsMock,
        signTransaction: vi.fn(),
        signMessage: vi.fn(),
      }),
      useAccounts: () => ({
        activeAccount: { value: { protocol: 'ethereum' } },
      }),
    }));
    vi.doMock('@/protocols/evm/libs/EvmRpcMethodsHandler', () => ({
      handleEvmRpcMethod: vi.fn(),
    }));
    vi.doMock('@/protocols/ethereum/config', () => ({
      ETH_RPC_WALLET_EVENTS: {
        chainChanged: 'chainChanged',
        accountsChanged: 'accountsChanged',
      },
    }));
    vi.doMock('@/background/utils', () => ({
      registerInPageContentScript: vi.fn(),
      updateDynamicRules: vi.fn(),
    }));
    vi.doMock('@/offscreen/wallet', () => ({
      init: vi.fn(),
      disconnect: vi.fn(),
    }));
  }

  async function loadListener() {
    vi.resetModules();
    // eslint-disable-next-line global-require
    (await import('@/offscreen/offscreen'));

    return (
      (global as any).browser.runtime.onMessage.addListener as vi.Mock
    ).mock.calls[0][0];
  }

  beforeEach(async () => {
    vi.resetModules();
    (global as any).browser = {
      runtime: {
        id: 'test-extension-id',
        onMessage: { addListener: vi.fn() },
        sendMessage: vi.fn(),
      },
      tabs: {
        query: vi.fn(),
        sendMessage: vi.fn(),
      },
    };
    mockOffscreenDependencies();
  });

  it.each([
    ['message for background', { target: 'background', method: 'accountsChanged' }],
    ['external sender', { target: 'offscreen', method: 'ledgerDiscoverAccounts' }, { id: 'other-extension-id' }],
  ])('does not claim ignored messages: %s', async (_label, msg, sender = { id: 'test-extension-id' }) => {
    const listener = await loadListener();

    expect(listener(msg, sender)).toBeUndefined();
  });

  it('does not claim accepted but unhandled offscreen messages', async () => {
    const listener = await loadListener();

    expect(listener(
      { target: 'offscreen', method: 'unknownMethod' },
      { id: 'test-extension-id' },
    )).toBeUndefined();
  });

  it('still returns responses for handled offscreen messages', async () => {
    const listener = await loadListener();

    await expect(listener(
      { target: 'offscreen', method: 'ledgerDiscoverAccounts' },
      { id: 'test-extension-id' },
    )).resolves.toEqual(['ledger-account']);
  });
});
