// @ts-nocheck
import { ref, nextTick } from 'vue';

/**
 * The EIP-1193 events the offscreen document sends the page when the user, or a dapp,
 * changes the active account or network. Runs the real Vue watchers.
 */
describe('offscreen wallet events', () => {
  let activeAccount;
  let activeNetworkName;
  let isSwitchingEvmChain;

  const ETH = { protocol: 'ethereum', address: '0xaaa' };
  const BNB = { protocol: 'bnb', address: '0xaaa' };
  const BNB_OTHER = { protocol: 'bnb', address: '0xbbb' };
  const AE = { protocol: 'aeternity', address: 'ak_aaa' };
  const BTC = { protocol: 'bitcoin', address: 'bc1aaa' };
  /** Of the last active account of each protocol */
  const lastActiveAccounts = { ethereum: ETH };

  beforeEach(async () => {
    vi.resetModules();
    activeAccount = ref(ETH);
    activeNetworkName = ref('Mainnet');
    isSwitchingEvmChain = ref(false);
    (global as any).browser = {
      runtime: {
        id: 'test-extension-id',
        getURL: (path) => `chrome-extension://test-extension-id/${path}`,
        onMessage: { addListener: vi.fn() },
        sendMessage: vi.fn(),
      },
      tabs: { query: vi.fn(), sendMessage: vi.fn() },
    };
    vi.doMock('@/lib/initPolyfills', () => ({}));
    vi.doMock('@/protocols/registerAdapters', () => ({}));
    vi.doMock('@/composables', () => ({
      useWalletConnect: vi.fn(),
      useNetworks: () => ({
        activeNetworkName,
        networks: ref({
          Mainnet: { protocols: { ethereum: { chainId: '1' }, bnb: { chainId: '56' } } },
          Testnet: { protocols: { ethereum: { chainId: '11155111' }, bnb: { chainId: '97' } } },
        }),
      }),
      useLedger: vi.fn(),
      useAccounts: () => ({
        activeAccount,
        getLastActiveProtocolAccount: (protocol) => (
          (activeAccount.value.protocol === protocol)
            ? activeAccount.value
            : lastActiveAccounts[protocol]
        ),
      }),
    }));
    vi.doMock('@/protocols/evm/libs/EvmRpcMethodsHandler', () => ({
      handleEvmRpcRequest: vi.fn(),
      isSwitchingEvmChain,
    }));
    vi.doMock('@/background/utils', () => ({
      registerInPageContentScript: vi.fn(),
      updateDynamicRules: vi.fn(),
    }));
    vi.doMock('@/offscreen/wallet', () => ({ init: vi.fn(), disconnect: vi.fn() }));
    await import('@/offscreen/offscreen');
  });

  afterEach(() => {
    ['@/lib/initPolyfills', '@/protocols/registerAdapters', '@/composables',
      '@/protocols/evm/libs/EvmRpcMethodsHandler', '@/background/utils', '@/offscreen/wallet',
      '@/constants',
    ].forEach((path) => vi.doUnmock(path));
  });

  const getEvents = () => (global as any).browser.runtime.sendMessage.mock.calls
    .map(([{ method, params }]) => [method, params.rpcMethodParams.result]);

  it('changes the chain when the active account is of another EVM protocol', async () => {
    activeAccount.value = BNB;
    await nextTick();

    expect(getEvents()).toEqual([['chainChanged', '0x38']]);
  });

  it('changes the chain and the accounts for an account of another address', async () => {
    activeAccount.value = BNB_OTHER;
    await nextTick();

    expect(getEvents()).toEqual([['chainChanged', '0x38'], ['accountsChanged', undefined]]);
  });

  it('changes the chain when the network changes', async () => {
    activeNetworkName.value = 'Testnet';
    await nextTick();

    expect(getEvents()).toEqual([['chainChanged', '0xaa36a7']]);
  });

  it('changes the accounts for Ethereum\'s account of another address after another EVM protocol', async () => {
    activeAccount.value = BNB_OTHER;
    await nextTick();
    activeAccount.value = AE;
    await nextTick();

    expect(getEvents()).toEqual([
      ['chainChanged', '0x38'],
      ['accountsChanged', undefined],
      ['chainChanged', '0x1'],
      ['accountsChanged', undefined],
    ]);
  });

  it('does not change the accounts from one account of another protocol than an EVM one to another', async () => {
    activeAccount.value = AE;
    await nextTick();
    activeAccount.value = BTC;
    await nextTick();

    expect(getEvents()).toEqual([]);
  });

  it('changes the chain once when the protocol and the network change together', async () => {
    activeAccount.value = BNB;
    activeNetworkName.value = 'Testnet';
    await nextTick();

    expect(getEvents()).toEqual([['chainChanged', '0x61']]);
  });

  it('changes the chain once when a dapp switch changes the protocol, then the network', async () => {
    isSwitchingEvmChain.value = true;
    await nextTick();
    activeAccount.value = BNB_OTHER;
    await nextTick();
    activeNetworkName.value = 'Testnet';
    await nextTick();
    isSwitchingEvmChain.value = false;
    await nextTick();

    expect(getEvents()).toEqual([['accountsChanged', undefined], ['chainChanged', '0x61']]);
  });

  it('changes the chain once a dapp switch of the protocol alone is done', async () => {
    isSwitchingEvmChain.value = true;
    await nextTick();
    activeAccount.value = BNB;
    await nextTick();
    expect(getEvents()).toEqual([]);

    isSwitchingEvmChain.value = false;
    await nextTick();
    expect(getEvents()).toEqual([['chainChanged', '0x38']]);
  });

  it('does not change the chain for a dapp switch the user declined', async () => {
    isSwitchingEvmChain.value = true;
    await nextTick();
    isSwitchingEvmChain.value = false;
    await nextTick();

    expect(getEvents()).toEqual([]);
  });

  it('does not change the chain for Ethereum after another protocol than an EVM one', async () => {
    activeAccount.value = AE;
    await nextTick();
    activeAccount.value = ETH;
    await nextTick();

    expect(getEvents()).toEqual([['accountsChanged', undefined]]);
  });

  it('changes the chain to the one of Ethereum while an account of another protocol is active', async () => {
    activeAccount.value = BNB;
    await nextTick();
    activeAccount.value = AE;
    await nextTick();
    activeAccount.value = ETH;
    await nextTick();

    expect(getEvents()).toEqual([
      ['chainChanged', '0x38'],
      ['chainChanged', '0x1'],
      ['accountsChanged', undefined],
    ]);
  });

  it('changes the chain for a dapp switch back to the one it had before another protocol', async () => {
    activeAccount.value = BNB;
    await nextTick();
    activeAccount.value = AE;
    await nextTick();
    activeAccount.value = ETH;
    await nextTick();
    isSwitchingEvmChain.value = true;
    await nextTick();
    activeAccount.value = BNB;
    await nextTick();
    isSwitchingEvmChain.value = false;
    await nextTick();

    expect(getEvents().filter(([method]) => method === 'chainChanged'))
      .toEqual([['chainChanged', '0x38'], ['chainChanged', '0x1'], ['chainChanged', '0x38']]);
  });

  it('does not change the chain when the wallet locks and unlocks', async () => {
    activeAccount.value = BNB;
    await nextTick();
    // No accounts while locked
    activeAccount.value = {};
    await nextTick();
    activeAccount.value = BNB;
    await nextTick();

    expect(getEvents().filter(([method]) => method === 'chainChanged'))
      .toEqual([['chainChanged', '0x38']]);
  });

  it('sends the events to every tab in Firefox, where it runs as the background page', async () => {
    const { browser } = global as any;
    browser.runtime.onInstalled = { addListener: vi.fn() };
    browser.tabs.query.mockResolvedValue([{ id: 1 }, { id: 2 }]);
    browser.tabs.sendMessage
      .mockRejectedValueOnce(new Error('Could not establish connection. Receiving end does not exist.'))
      .mockResolvedValue(undefined);
    vi.resetModules();
    vi.doMock('@/constants', async (importOriginal) => ({
      ...(await importOriginal()),
      IS_FIREFOX: true,
    }));
    // The one loaded before keeps watching the account it got
    activeAccount = ref(ETH);
    await import('@/offscreen/offscreen');

    activeAccount.value = BNB_OTHER;
    await vi.waitFor(() => expect(browser.tabs.sendMessage).toHaveBeenCalledTimes(4));

    expect(browser.tabs.query).toHaveBeenCalledWith({});
    const chainEvent = {
      superheroWalletApproved: true, method: 'chainChanged', result: '0x38', type: 'result',
    };
    // Without the address, each content script asks which accounts its page is permitted
    const accountsEvent = {
      superheroWalletApproved: true, method: 'accountsChanged', result: undefined, type: 'result',
    };
    expect(browser.tabs.sendMessage.mock.calls)
      .toEqual([[1, chainEvent], [2, chainEvent], [1, accountsEvent], [2, accountsEvent]]);
    expect(browser.runtime.sendMessage).not.toHaveBeenCalled();
  });
});
