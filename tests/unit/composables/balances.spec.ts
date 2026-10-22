// @ts-nocheck
import { ref } from 'vue';

/**
 * `useBalances` is tested against the real `ProtocolAdapterFactory` singleton (with
 * `fetchBalance` spied per test, since that is the actual network boundary). `useAccounts`,
 * `useNetworks` and `useCurrencies` are mocked with plain Vue refs so each test can drive
 * account lists / active network / currency rate deterministically.
 */
let activeAccountRef;
let accountsRef;
let activeNetworkRef;
let onNetworkChangeMock;
let getCurrentCurrencyRateMock;

describe('useBalances', () => {
  beforeEach(async () => {
    vi.resetModules();
    localStorage.clear();

    activeAccountRef = ref({ protocol: 'aeternity', address: 'ak_active' });
    accountsRef = ref([
      { protocol: 'aeternity', address: 'ak_active' },
      { protocol: 'aeternity', address: 'ak_other' },
    ]);
    activeNetworkRef = ref({ name: 'Mainnet' });
    onNetworkChangeMock = vi.fn();
    getCurrentCurrencyRateMock = vi.fn(() => 1);

    // These mocks must be registered *before* `registerAdapters` is imported below:
    // `registerAdapters` transitively loads the real `accounts`/`networks`/`currencies`
    // composables (via aeSdk.ts -> accounts.ts -> the `@/composables` barrel), so
    // mocking them afterwards would be too late - the real modules would already be
    // cached and linked against each other for this module generation.
    vi.doMock('@/composables/accounts', () => ({
      useAccounts: () => ({ activeAccount: activeAccountRef, accounts: accountsRef }),
    }));
    vi.doMock('@/composables/networks', () => ({
      useNetworks: () => ({
        activeNetwork: activeNetworkRef,
        onNetworkChange: onNetworkChangeMock,
      }),
    }));
    vi.doMock('@/composables/currencies', () => ({
      useCurrencies: () => ({ getCurrentCurrencyRate: getCurrentCurrencyRateMock }),
    }));

    await import('@/protocols/registerAdapters');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /** Reload the modules with stored balances, as when the app opens */
  async function loadStoredBalances(networkName) {
    const { WalletStorage } = await import('@/lib/WalletStorage');
    const { STORAGE_KEYS } = await import('@/constants');
    WalletStorage.set(STORAGE_KEYS.balances, { aeternity: { ak_active: '5' } });
    WalletStorage.set(STORAGE_KEYS.balancesNetworkName, networkName);
    vi.resetModules();
    await import('@/protocols/registerAdapters');
    const { useBalances } = await import('@/composables/balances');
    const result = useBalances();
    await new Promise((resolve) => { setTimeout(resolve); });
    expect(result.balance.value.toString()).toBe('5');
    return result;
  }

  it('fetches and stores the balance of every account', async () => {
    const { ProtocolAdapterFactory } = await import('@/lib/ProtocolAdapterFactory');
    const adapter = ProtocolAdapterFactory.getAdapter('aeternity');
    vi.spyOn(adapter, 'fetchBalance').mockImplementation(
      async (address) => (address === 'ak_active' ? '1000000000000000000' : '2000000000000000000'),
    );

    const { useBalances } = await import('@/composables/balances');
    const { updateBalances, balance, getAccountBalance } = useBalances();

    await updateBalances();

    expect(balance.value.toString()).toBe('1000000000000000000');
    expect(getAccountBalance('aeternity', 'ak_other').toString()).toBe('2000000000000000000');
    expect(adapter.fetchBalance).toHaveBeenCalledTimes(2);
  });

  it('discards the fetch result if the active network changed while it was in flight', async () => {
    const { ProtocolAdapterFactory } = await import('@/lib/ProtocolAdapterFactory');
    const adapter = ProtocolAdapterFactory.getAdapter('aeternity');
    const fetchBalanceSpy = vi.spyOn(adapter, 'fetchBalance')
      .mockResolvedValueOnce('5')
      .mockResolvedValueOnce('7');

    const { useBalances } = await import('@/composables/balances');
    const { updateBalances, balances } = useBalances();

    // Establish an initial, settled balance snapshot on "Mainnet".
    await updateBalances();
    expect(balances.value.aeternity.ak_active.toString()).toBe('5');

    let resolveFetch;
    const pendingFetch = new Promise((resolve) => { resolveFetch = resolve; });
    fetchBalanceSpy.mockImplementation(() => pendingFetch);

    const updatePromise = updateBalances();
    activeNetworkRef.value = { name: 'Testnet' }; // switch network mid-flight
    resolveFetch('999');
    await updatePromise;

    // The stale-network result must be discarded - balances stay at the last good snapshot.
    expect(balances.value.aeternity.ak_active.toString()).toBe('5');
  });

  it('dedupes concurrent updateBalances() calls into a single fetch batch', async () => {
    const { ProtocolAdapterFactory } = await import('@/lib/ProtocolAdapterFactory');
    const adapter = ProtocolAdapterFactory.getAdapter('aeternity');
    const fetchBalanceSpy = vi.spyOn(adapter, 'fetchBalance').mockResolvedValue('1');

    const { useBalances } = await import('@/composables/balances');
    const { updateBalances } = useBalances();

    await Promise.all([updateBalances(), updateBalances()]);

    // 2 accounts x 1 batch, not x2 batches.
    expect(fetchBalanceSpy).toHaveBeenCalledTimes(2);
  });

  it('stores 0 on a 404 (not-found) balance response, without logging a warning', async () => {
    const { ProtocolAdapterFactory } = await import('@/lib/ProtocolAdapterFactory');
    const adapter = ProtocolAdapterFactory.getAdapter('aeternity');
    const fetchBalanceSpy = vi.spyOn(adapter, 'fetchBalance').mockResolvedValue('5');
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const { useBalances } = await import('@/composables/balances');
    const { updateBalances, balance, balances } = useBalances();

    await updateBalances();
    expect(balance.value.toString()).toBe('5');

    fetchBalanceSpy.mockRejectedValue(
      Object.assign(new Error('not found'), { statusCode: 404 }),
    );
    await updateBalances();

    expect(balances.value.aeternity.ak_active.toString()).toBe('0');
    expect(balances.value.aeternity.ak_other.toString()).toBe('0');
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('keeps the previous balance when a later fetch rejects with 500', async () => {
    const { ProtocolAdapterFactory } = await import('@/lib/ProtocolAdapterFactory');
    const adapter = ProtocolAdapterFactory.getAdapter('aeternity');
    const fetchBalanceSpy = vi.spyOn(adapter, 'fetchBalance').mockImplementation(
      async (address) => (address === 'ak_active' ? '5' : '7'),
    );
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const { useBalances } = await import('@/composables/balances');
    const { updateBalances, balance, balances } = useBalances();

    await updateBalances();

    const serverError = Object.assign(new Error('Internal Server Error'), { statusCode: 500 });
    fetchBalanceSpy.mockImplementation(
      async (address) => {
        if (address === 'ak_active') throw serverError;
        return '8';
      },
    );
    await updateBalances();

    expect(balance.value.toString()).toBe('5');
    expect(balances.value.aeternity.ak_other.toString()).toBe('8');
    expect(warnSpy).toHaveBeenCalledWith('Unknown rejection', serverError);
  });

  it('leaves no entry when the first fetch fails, so the balance renders as 0', async () => {
    const { ProtocolAdapterFactory } = await import('@/lib/ProtocolAdapterFactory');
    const adapter = ProtocolAdapterFactory.getAdapter('aeternity');
    vi.spyOn(adapter, 'fetchBalance').mockRejectedValue(new Error('Network Error'));
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    const { useBalances } = await import('@/composables/balances');
    const { updateBalances, balance, balances } = useBalances();

    await updateBalances();

    expect(balances.value.aeternity?.ak_active).toBeUndefined();
    expect(balance.value.toString()).toBe('0');
  });

  it('keeps the stored balance of the active network when the fetch fails', async () => {
    const { updateBalances, balance } = await loadStoredBalances('Mainnet');
    const { ProtocolAdapterFactory } = await import('@/lib/ProtocolAdapterFactory');
    vi.spyOn(ProtocolAdapterFactory.getAdapter('aeternity'), 'fetchBalance')
      .mockRejectedValue(new Error('Network Error'));
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    await updateBalances();

    expect(balance.value.toString()).toBe('5');
  });

  it('does not keep the stored balance of another network when the fetch fails', async () => {
    const { updateBalances, balance } = await loadStoredBalances('Testnet');
    const { ProtocolAdapterFactory } = await import('@/lib/ProtocolAdapterFactory');
    vi.spyOn(ProtocolAdapterFactory.getAdapter('aeternity'), 'fetchBalance')
      .mockRejectedValue(new Error('Network Error'));
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    await updateBalances();

    expect(balance.value.toString()).toBe('0');
  });

  it('sums every account balance converted to the current currency rate', async () => {
    const { ProtocolAdapterFactory } = await import('@/lib/ProtocolAdapterFactory');
    const adapter = ProtocolAdapterFactory.getAdapter('aeternity');
    vi.spyOn(adapter, 'fetchBalance').mockImplementation(
      async (address) => (address === 'ak_active' ? '2' : '3'),
    );
    getCurrentCurrencyRateMock.mockReturnValue(2);

    const { useBalances } = await import('@/composables/balances');
    const { updateBalances, accountsTotalBalance } = useBalances();

    await updateBalances();

    expect(accountsTotalBalance.value).toBe('10.00'); // (2 + 3) * 2
  });
});
