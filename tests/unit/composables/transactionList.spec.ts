// @ts-nocheck
import { ref } from 'vue';
import { POLLING_INTERVAL_TRANSACTIONS } from '@/constants';

/**
 * A failed history request must not leave the list loading forever or mark it as complete
 * (`isEndReached` is persisted). Runs the real composable; fakes the adapter's history
 * requests, or the API under the real adapter.
 */
const flushStorage = () => new Promise((resolve) => { setTimeout(resolve, 5); });

function page(hashes, paginationParams = {}) {
  return {
    regularTransactions: hashes.map((hash) => ({ hash, protocol: 'bitcoin', tx: {} })),
    pendingTransactions: [],
    paginationParams,
  };
}

describe('useTransactionList on API errors', () => {
  let warnSpy;

  beforeEach(async () => {
    vi.resetModules();
    localStorage.clear();
    vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] });
    vi.doMock('@/composables/connection', () => ({
      useConnection: () => ({ isOnline: ref(true) }),
    }));
    vi.doMock('@/composables/ui', () => ({
      useUi: () => ({ isAppActive: ref(true) }),
    }));
    vi.doMock('@/composables/latestTransactionList', () => ({
      useLatestTransactionList: () => ({
        accountsTransactionsLatest: ref({}),
        accountsTransactionsPending: ref({}),
      }),
    }));
    await import('@/protocols/registerAdapters');
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  async function getAdapter(protocol) {
    const { ProtocolAdapterFactory } = await import('@/lib/ProtocolAdapterFactory');
    return ProtocolAdapterFactory.getAdapter(protocol);
  }

  async function useTransactionList(options) {
    const { useTransactionList: useList } = await import('@/composables/transactionList');
    return useList(options);
  }

  it('stops loading when the request fails and retries after the polling interval', async () => {
    const adapter = await getAdapter('bitcoin');
    const fetchSpy = vi.spyOn(adapter, 'fetchAccountTransactions')
      .mockRejectedValueOnce(new Error('HTTP 500'))
      .mockResolvedValueOnce(page(['tx1'], { lastTxId: 'tx1' }));
    const list = await useTransactionList({ accountAddress: 'bc1qtest', protocol: 'bitcoin' });

    await list.initializeTransactionListPolling();
    expect(list.isLoading.value).toBe(false);
    expect(list.isEndReached.value).toBe(false);

    // Load-more fires again when `isLoading` turns false, it must not hammer a failing API
    await list.loadCurrentPageTransactions();
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    vi.setSystemTime(Date.now() + POLLING_INTERVAL_TRANSACTIONS);
    await list.loadCurrentPageTransactions();
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(list.transactionsLoaded.value.map(({ hash }) => hash)).toEqual(['tx1']);
    expect(list.isLoading.value).toBe(false);
    list.stopTransactionListPolling();
  });

  it('loads the first page by polling after the first load failed, and appends the next', async () => {
    const adapter = await getAdapter('bitcoin');
    vi.spyOn(adapter, 'fetchAccountTransactions')
      .mockRejectedValueOnce(new Error('HTTP 500'))
      .mockResolvedValueOnce(page(['tx1'], { lastTxId: 'tx1' }))
      .mockResolvedValueOnce(page(['tx2'], {}));
    const list = await useTransactionList({ accountAddress: 'bc1qtest', protocol: 'bitcoin' });

    await list.initializeTransactionListPolling();
    await vi.advanceTimersByTimeAsync(POLLING_INTERVAL_TRANSACTIONS);
    expect(list.transactionsLoaded.value.map(({ hash }) => hash)).toEqual(['tx1']);

    await list.loadCurrentPageTransactions();
    expect(list.transactionsLoaded.value.map(({ hash }) => hash)).toEqual(['tx1', 'tx2']);
    list.stopTransactionListPolling();
  });

  it('keeps polling after a failed polling request', async () => {
    const adapter = await getAdapter('bitcoin');
    const error = new Error('HTTP 500');
    const fetchSpy = vi.spyOn(adapter, 'fetchAccountTransactions')
      .mockResolvedValueOnce(page(['tx1'], { lastTxId: 'tx1' }))
      .mockRejectedValueOnce(error)
      .mockResolvedValueOnce(page(['tx0', 'tx1'], { lastTxId: 'tx1' }));
    const list = await useTransactionList({ accountAddress: 'bc1qtest', protocol: 'bitcoin' });

    await list.initializeTransactionListPolling();
    await vi.advanceTimersByTimeAsync(POLLING_INTERVAL_TRANSACTIONS);
    await vi.advanceTimersByTimeAsync(POLLING_INTERVAL_TRANSACTIONS);

    expect(fetchSpy).toHaveBeenCalledTimes(3);
    expect(list.transactionsLoaded.value.map(({ hash }) => hash)).toEqual(['tx0', 'tx1']);
    expect(warnSpy).toHaveBeenCalledWith('Unknown rejection', error);
    list.stopTransactionListPolling();
  });

  it('stops loading when another list takes over the state during the request', async () => {
    const adapter = await getAdapter('bitcoin');
    let resolveFetch;
    vi.spyOn(adapter, 'fetchAccountTransactions')
      .mockImplementationOnce(() => new Promise((resolve) => { resolveFetch = resolve; }));
    const list = await useTransactionList({ accountAddress: 'bc1qtest', protocol: 'bitcoin' });

    const loading = list.loadCurrentPageTransactions();
    await useTransactionList({ accountAddress: 'bc1qother', protocol: 'bitcoin' });
    resolveFetch(page(['tx1'], { lastTxId: 'tx1' }));
    await loading;

    expect(list.isLoading.value).toBe(false);
  });

  it('does not request a page for a list another one replaced', async () => {
    const adapter = await getAdapter('bitcoin');
    const fetchSpy = vi.spyOn(adapter, 'fetchAccountTransactions')
      .mockResolvedValue(page(['tx1'], { lastTxId: 'tx1' }));
    const list = await useTransactionList({ accountAddress: 'bc1qtest', protocol: 'bitcoin' });
    await list.loadCurrentPageTransactions();
    await useTransactionList({ accountAddress: 'bc1qother', protocol: 'bitcoin' });

    // Load-more fires again when `isLoading` turns false, a discarded page would loop
    await list.loadCurrentPageTransactions();

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(list.isLoading.value).toBe(false);
  });

  it('stops polling without a request when another list took over the state', async () => {
    const adapter = await getAdapter('bitcoin');
    const fetchSpy = vi.spyOn(adapter, 'fetchAccountTransactions')
      .mockResolvedValueOnce(page(['tx1'], { lastTxId: 'tx1' }))
      .mockRejectedValue(new Error('HTTP 500'));
    const list = await useTransactionList({ accountAddress: 'bc1qtest', protocol: 'bitcoin' });
    await list.initializeTransactionListPolling();

    await useTransactionList({ accountAddress: 'bc1qother', protocol: 'bitcoin' });
    await vi.advanceTimersByTimeAsync(POLLING_INTERVAL_TRANSACTIONS * 2);

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    list.stopTransactionListPolling();
  });

  it('does not mark the aeternity list complete when the middleware fails on the next page', async () => {
    const adapter = await getAdapter('aeternity');
    vi.spyOn(adapter, 'fetchPendingTransactions').mockResolvedValue([]);
    const fetchSpy = vi.spyOn(adapter, 'fetchAccountTransactions').mockResolvedValueOnce({
      regularTransactions: [{ hash: 'th_1', protocol: 'aeternity', tx: {} }],
      pendingTransactions: [],
      paginationParams: { nextPageUrl: '/v2/accounts/ak_test/activities?cursor=next' },
    });
    const list = await useTransactionList({ accountAddress: 'ak_test', protocol: 'aeternity' });
    await list.loadCurrentPageTransactions();

    fetchSpy.mockRestore();
    vi.spyOn(global, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'));
    await list.loadCurrentPageTransactions();

    expect(list.isEndReached.value).toBe(false);
    expect(list.isLoading.value).toBe(false);
    await flushStorage();
    const [, stored] = Object.entries(localStorage).find(([key]) => key.includes('transactions-loaded'));
    expect(JSON.parse(stored)).toMatchObject({
      isEndReached: false,
      nextPagePaginationParams: { nextPageUrl: '/v2/accounts/ak_test/activities?cursor=next' },
    });
  });
});
