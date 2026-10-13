// @ts-nocheck
const WALLET_PAGE = { id: 'test-extension-id', url: 'chrome-extension://test-extension-id/index.html?id=1' };
const WEB_PAGE = { id: 'test-extension-id', url: 'https://aepp.example/', tab: { id: 1 } };

describe('offscreen message listener', () => {
  const originalLocation = window.location;
  const ledger = {
    deriveAccount: vi.fn(),
    discoverAccounts: vi.fn(),
    signTransaction: vi.fn(),
    signMessage: vi.fn(),
  };
  const handleEvmRpcMethod = vi.fn();
  const wallet = { init: vi.fn(), disconnect: vi.fn() };

  function mockOffscreenDependencies() {
    Object.values(ledger).forEach((mock) => mock.mockReset());
    ledger.discoverAccounts.mockResolvedValue(['ledger-account']);
    handleEvmRpcMethod.mockReset().mockResolvedValue({ result: '0x1' });
    wallet.disconnect.mockReset();

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
      useLedger: () => ledger,
      useAccounts: () => ({
        activeAccount: { value: { protocol: 'ethereum' } },
      }),
    }));
    vi.doMock('@/protocols/evm/libs/EvmRpcMethodsHandler', () => ({ handleEvmRpcMethod }));
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
    vi.doMock('@/offscreen/wallet', () => wallet);
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
        getURL: (path) => `chrome-extension://test-extension-id/${path}`,
        onMessage: { addListener: vi.fn() },
        sendMessage: vi.fn(),
      },
      tabs: {
        query: vi.fn(),
        sendMessage: vi.fn(),
      },
    };
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...originalLocation, reload: vi.fn() },
    });
    mockOffscreenDependencies();
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', { configurable: true, value: originalLocation });
  });

  it.each([
    ['message for background', { target: 'background', method: 'accountsChanged' }],
    ['external sender', { target: 'offscreen', method: 'ledgerDiscoverAccounts' }, { id: 'other-extension-id' }],
  ])('does not claim ignored messages: %s', async (_label, msg, sender = WALLET_PAGE) => {
    const listener = await loadListener();

    expect(listener(msg, sender)).toBeUndefined();
  });

  it('does not claim accepted but unhandled offscreen messages', async () => {
    const listener = await loadListener();

    expect(listener({ target: 'offscreen', method: 'unknownMethod' }, WALLET_PAGE)).toBeUndefined();
  });

  it('still returns responses for handled offscreen messages', async () => {
    const listener = await loadListener();

    await expect(listener(
      { target: 'offscreen', method: 'ledgerDiscoverAccounts' },
      WALLET_PAGE,
    )).resolves.toEqual(['ledger-account']);
  });

  it('reloads when the wallet resets', async () => {
    const listener = await loadListener();

    listener({ target: 'offscreen', method: 'reload' }, WALLET_PAGE);

    expect(wallet.disconnect).toHaveBeenCalled();
    expect(window.location.reload).toHaveBeenCalled();
  });

  describe('messages a web page makes the content script relay', () => {
    /** The shape `sendToOffscreen` in `content-scripts/inject.ts` sends. */
    function relayed(method, params = {}) {
      return {
        target: 'offscreen', jsonrpc: '2.0', id: null, method, params,
      };
    }

    it.each([
      'reload',
      'ledgerDeriveAccount',
      'ledgerDiscoverAccounts',
      'ledgerSignTransaction',
      'ledgerSignMessage',
    ])('ignores the wallet-only %s', async (method) => {
      const listener = await loadListener();

      const response = listener(relayed(method, { payload: { accountIndex: 0 } }), WEB_PAGE);

      expect(response).toBeUndefined();
      expect(wallet.disconnect).not.toHaveBeenCalled();
      expect(window.location.reload).not.toHaveBeenCalled();
      Object.values(ledger).forEach((mock) => expect(mock).not.toHaveBeenCalled());
    });

    it('still serves EVM RPC calls', async () => {
      const listener = await loadListener();
      const params = { aepp: 'https://aepp.example', rpcMethodParams: { address: '0x0' } };

      await expect(listener(relayed('eth_getBalance', params), WEB_PAGE))
        .resolves.toEqual({ result: '0x1' });
      expect(handleEvmRpcMethod)
        .toHaveBeenCalledWith('https://aepp.example', 'eth_getBalance', { address: '0x0' });
    });
  });
});
