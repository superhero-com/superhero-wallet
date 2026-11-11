// @ts-nocheck
import { ref } from 'vue';

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
  const handleEvmRpcRequest = vi.fn();
  const getConnectedSiteAccounts = vi.fn();
  const wallet = { init: vi.fn(), disconnect: vi.fn() };

  function mockOffscreenDependencies(isFirefox = false) {
    Object.values(ledger).forEach((mock) => mock.mockReset());
    ledger.discoverAccounts.mockResolvedValue(['ledger-account']);
    handleEvmRpcRequest.mockReset().mockResolvedValue({ result: '0x1' });
    getConnectedSiteAccounts.mockReset().mockReturnValue(['0xabc']);
    wallet.disconnect.mockReset();

    vi.doMock('vue', () => ({
      watch: vi.fn(),
    }));
    vi.doMock('@/lib/initPolyfills', () => ({}));
    vi.doMock('@/protocols/registerAdapters', () => ({}));
    vi.doMock('@/constants', () => ({
      IS_FIREFOX: isFirefox,
      SESSION_METHODS: { mutateSessionKey: 'mutateSessionKey' },
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
    vi.doMock('@/protocols/evm/libs/EvmRpcMethodsHandler', () => ({
      getConnectedSiteAccounts,
      handleEvmRpcRequest,
      isSwitchingEvmChain: ref(false),
    }));
    vi.doMock('@/protocols/ethereum/config', () => ({
      ETH_CONTENT_SCRIPT_METHODS: { getPermittedAccounts: 'superhero_getPermittedAccounts' },
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
        onInstalled: { addListener: vi.fn() },
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

  describe('Firefox session mutation owner', () => {
    const key = Buffer.alloc(32, 3).toString('base64');
    const message = {
      target: 'offscreen', method: 'mutateSessionKey', payload: { operation: 'set', key },
    };

    async function loadFirefoxListener() {
      mockOffscreenDependencies(true);
      const stored = {};
      browser.storage = {
        session: {
          set: vi.fn(async (values) => { Object.assign(stored, values); }),
          get: vi.fn(async (name) => ({ [name]: stored[name] })),
          remove: vi.fn(async (name) => { delete stored[name]; }),
        },
      };
      return { listener: await loadListener(), stored };
    }

    it('accepts a wallet page mutation and returns the persisted result', async () => {
      const { listener, stored } = await loadFirefoxListener();
      await expect(listener(message, WALLET_PAGE)).resolves.toEqual({ ok: true });
      expect(Buffer.from(stored.exportedEncryptionKey).toString('base64')).toBe(key);
    });

    it('rejects a content script mutation without touching storage', async () => {
      const { listener, stored } = await loadFirefoxListener();
      expect(listener(message, WEB_PAGE)).toBeUndefined();
      expect(stored).toEqual({});
      expect(browser.storage.session.set).not.toHaveBeenCalled();
    });

    it('reports a failed storage mutation explicitly', async () => {
      const { listener } = await loadFirefoxListener();
      browser.storage.session.set.mockRejectedValueOnce(new Error('Storage unavailable'));
      await expect(listener(message, WALLET_PAGE))
        .resolves.toEqual({ ok: false, error: 'Storage unavailable' });
    });
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
      const params = { aepp: 'https://aepp.example', rpcMethodParams: ['0x0', 'latest'] };

      await expect(listener(relayed('eth_getBalance', params), WEB_PAGE))
        .resolves.toEqual({ result: '0x1' });
      expect(handleEvmRpcRequest).toHaveBeenCalledWith(
        'https://aepp.example',
        'eth_getBalance',
        ['0x0', 'latest'],
        undefined,
        undefined,
        undefined,
        undefined,
        WEB_PAGE.tab.id,
      );
    });

    it('answers the accounts the page of the sender is permitted', async () => {
      const listener = await loadListener();

      await expect(listener(
        relayed('superhero_getPermittedAccounts', { aepp: 'https://aescan.io' }),
        WEB_PAGE,
      )).resolves.toEqual({ result: ['0xabc'] });
      expect(getConnectedSiteAccounts).toHaveBeenCalledWith('https://aepp.example');
      expect(handleEvmRpcRequest).not.toHaveBeenCalled();
    });

    it('takes the origin and the tab from the sender, not from the message', async () => {
      const listener = await loadListener();

      await listener(relayed('eth_requestAccounts', { aepp: 'https://aescan.io' }), WEB_PAGE);

      expect(handleEvmRpcRequest).toHaveBeenCalledWith(
        'https://aepp.example',
        'eth_requestAccounts',
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        WEB_PAGE.tab.id,
      );
    });
  });
});
