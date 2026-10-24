// @ts-nocheck
import { defineComponent, h, ref } from 'vue';
import { flushPromises, mount } from '@vue/test-utils';

/**
 * Token balances of every account are polled. A failed fetch keeps what is shown.
 * Runs the real composable, networks and adapters; fakes the accounts and the fetches.
 */
const ACCOUNT = { protocol: 'aeternity', address: 'ak_2dATVcZ9KJU5a8hdsVtTv21pYiGWiPbmVcU1Pz72FFqpk9pSRR' };

function tokenBalance(contractId, amount = '1') {
  return {
    address: ACCOUNT.address,
    protocol: 'aeternity',
    contractId,
    amount,
    convertedBalance: Number(amount),
    decimals: 0,
    symbol: 'TKN',
    name: 'Token',
    price: 0,
  };
}

describe('useFungibleTokens token balances', () => {
  let adapter;

  beforeEach(async () => {
    vi.resetModules();
    localStorage.clear();
    // A mounted component polls only while the app is active and online
    vi.doMock('@/composables/connection', async (importOriginal) => {
      const actual = await importOriginal();
      return {
        ...actual,
        useConnection: () => ({ ...actual.useConnection(), isOnline: ref(true) }),
      };
    });
    vi.doMock('@/composables/ui', async (importOriginal) => {
      const actual = await importOriginal();
      return { ...actual, useUi: () => ({ ...actual.useUi(), isAppActive: ref(true) }) };
    });
    vi.doMock('@/composables/aeSdk', () => ({
      useAeSdk: () => ({ getAeSdk: vi.fn(), isTippingSupported: ref(true) }),
    }));
    vi.doMock('@/composables/accounts', () => ({
      useAccounts: () => ({
        accounts: ref([ACCOUNT]),
        protocolsInUse: ref(['aeternity']),
        getLastActiveProtocolAccount: () => ACCOUNT,
      }),
    }));
    await import('@/protocols/registerAdapters');
    const { ProtocolAdapterFactory } = await import('@/lib/ProtocolAdapterFactory');
    adapter = ProtocolAdapterFactory.getAdapter('aeternity');
  });

  afterEach(() => {
    vi.doUnmock('@/composables/connection');
    vi.doUnmock('@/composables/ui');
    vi.doUnmock('@/composables/aeSdk');
    vi.doUnmock('@/composables/accounts');
    vi.restoreAllMocks();
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  async function useFungibleTokens() {
    return (await import('@/composables/fungibleTokens')).useFungibleTokens();
  }

  /** Reload the modules with stored token balances, as when the app opens */
  async function loadStoredTokenBalances(networkName) {
    const { WalletStorage } = await import('@/lib/WalletStorage');
    const { STORAGE_KEYS } = await import('@/constants');
    WalletStorage.set(STORAGE_KEYS.fungibleTokenBalances, [tokenBalance('ct_stored')]);
    WalletStorage.set(STORAGE_KEYS.fungibleTokenBalancesNetworkName, networkName);
    vi.resetModules();
    await import('@/protocols/registerAdapters');
    const { ProtocolAdapterFactory } = await import('@/lib/ProtocolAdapterFactory');
    adapter = ProtocolAdapterFactory.getAdapter('aeternity');
    const result = await useFungibleTokens();
    await new Promise((resolve) => { setTimeout(resolve); });
    expect(result.tokenBalances.value).toEqual([tokenBalance('ct_stored')]);
    return result;
  }

  it('keeps cached balances when an adapter returns null', async () => {
    vi.spyOn(adapter, 'fetchAccountTokenBalances')
      .mockResolvedValueOnce([tokenBalance('ct_a')])
      .mockResolvedValueOnce(null);
    const { tokenBalances, loadTokenBalances } = await useFungibleTokens();

    await loadTokenBalances();
    await loadTokenBalances();

    expect(tokenBalances.value).toEqual([tokenBalance('ct_a')]);
  });

  it('keeps cached aeternity token balances when the middleware fails', async () => {
    const fetchSpy = vi.spyOn(adapter, 'fetchAccountTokenBalances')
      .mockResolvedValueOnce([tokenBalance('ct_a')]);
    const { tokenBalances, loadTokenBalances } = await useFungibleTokens();
    await loadTokenBalances();

    fetchSpy.mockRestore();
    vi.spyOn(global, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'));
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    await loadTokenBalances();

    expect(tokenBalances.value).toEqual([tokenBalance('ct_a')]);
  });

  it('keeps the stored balances of the active network when an adapter returns null', async () => {
    const { tokenBalances, loadTokenBalances } = await loadStoredTokenBalances('Mainnet');
    vi.spyOn(adapter, 'fetchAccountTokenBalances').mockResolvedValue(null);

    await loadTokenBalances();

    expect(tokenBalances.value).toEqual([tokenBalance('ct_stored')]);
  });

  it('does not keep the stored balances of another network when an adapter returns null', async () => {
    const { tokenBalances, loadTokenBalances } = await loadStoredTokenBalances('Testnet');
    vi.spyOn(adapter, 'fetchAccountTokenBalances').mockResolvedValue(null);

    await loadTokenBalances();

    expect(tokenBalances.value).toEqual([]);
  });

  it('discards a batch that resolves after a network switch and loads the new network', async () => {
    let resolveMainnetFetch;
    let resolveTestnetFetch;
    const fetchSpy = vi.spyOn(adapter, 'fetchAccountTokenBalances')
      .mockImplementationOnce(() => new Promise((resolve) => { resolveMainnetFetch = resolve; }))
      .mockImplementationOnce(() => new Promise((resolve) => { resolveTestnetFetch = resolve; }));
    const { tokenBalances, loadTokenBalances } = await useFungibleTokens();
    const { useNetworks } = await import('@/composables/networks');
    const { NETWORK_NAME_TESTNET } = await import('@/constants');

    const loading = loadTokenBalances();
    useNetworks().switchNetwork(NETWORK_NAME_TESTNET);
    resolveMainnetFetch([tokenBalance('ct_mainnet')]);

    await flushPromises();
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(tokenBalances.value).toEqual([]);

    resolveTestnetFetch([tokenBalance('ct_testnet')]);
    await loading;
    expect(tokenBalances.value).toEqual([tokenBalance('ct_testnet')]);
  });

  it('can load again after a failed batch', async () => {
    const fetchSpy = vi.spyOn(adapter, 'fetchAccountTokenBalances')
      .mockRejectedValueOnce(new Error('Unexpected'))
      .mockResolvedValueOnce([tokenBalance('ct_a')]);
    const { tokenBalances, loadTokenBalances } = await useFungibleTokens();

    await expect(loadTokenBalances()).rejects.toThrow('Unexpected');
    await loadTokenBalances();

    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(tokenBalances.value).toEqual([tokenBalance('ct_a')]);
  });

  it('skips the poll while a batch is still running', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date'] });
    let resolveFetch;
    const fetchSpy = vi.spyOn(adapter, 'fetchAccountTokenBalances')
      .mockImplementation(() => new Promise((resolve) => { resolveFetch = resolve; }));
    // The currency rates the same component polls
    vi.spyOn(global, 'fetch').mockImplementation(async () => new Response('{}'));
    const { useFungibleTokens: useTokens } = await import('@/composables/fungibleTokens');
    const page = document.createElement('div');
    page.classList.add('ion-page');
    document.body.appendChild(page);
    let tokenBalances;
    const wrapper = mount(defineComponent({
      setup() {
        ({ tokenBalances } = useTokens());
        return {};
      },
      render: () => h('div'),
    }), { attachTo: page });
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(30000);
    resolveFetch([tokenBalance('ct_a')]);
    await flushPromises();

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(tokenBalances.value).toEqual([tokenBalance('ct_a')]);
    wrapper.unmount();
  });

  it('loads the balances again on a network that shares the aeternity middleware', async () => {
    const fetchSpy = vi.spyOn(adapter, 'fetchAccountTokenBalances')
      .mockResolvedValueOnce([tokenBalance('ct_mainnet')])
      .mockResolvedValueOnce([tokenBalance('ct_custom')]);
    const { tokenBalances, loadTokenBalances } = await useFungibleTokens();
    const { useNetworks } = await import('@/composables/networks');
    const { NETWORK_NAME_MAINNET } = await import('@/constants');
    const { networks, addCustomNetwork, switchNetwork } = useNetworks();
    await loadTokenBalances();

    addCustomNetwork({ ...networks.value[NETWORK_NAME_MAINNET], name: 'Custom' });
    switchNetwork('Custom');
    expect(tokenBalances.value).toEqual([]);
    await flushPromises();

    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(tokenBalances.value).toEqual([tokenBalance('ct_custom')]);
  });

  it('replaces the balances with an empty list when the account has no tokens', async () => {
    vi.spyOn(adapter, 'fetchAccountTokenBalances')
      .mockResolvedValueOnce([tokenBalance('ct_a')])
      .mockResolvedValueOnce([]);
    const { tokenBalances, loadTokenBalances } = await useFungibleTokens();

    await loadTokenBalances();
    await loadTokenBalances();

    expect(tokenBalances.value).toEqual([]);
  });
});
