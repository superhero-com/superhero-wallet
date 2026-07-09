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

  it('treats a 404 (not-found) balance response as zero, without logging a warning', async () => {
    const { ProtocolAdapterFactory } = await import('@/lib/ProtocolAdapterFactory');
    const adapter = ProtocolAdapterFactory.getAdapter('aeternity');
    vi.spyOn(adapter, 'fetchBalance').mockRejectedValue(
      Object.assign(new Error('not found'), { statusCode: 404 }),
    );
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const { useBalances } = await import('@/composables/balances');
    const { updateBalances, balance } = useBalances();

    await updateBalances();

    expect(balance.value.toString()).toBe('0');
    expect(warnSpy).not.toHaveBeenCalled();
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
