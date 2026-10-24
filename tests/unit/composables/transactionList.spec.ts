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
  const isAppActive = ref(true);
  const isOnline = ref(true);

  beforeEach(async () => {
    isAppActive.value = true;
    isOnline.value = true;
    vi.resetModules();
    localStorage.clear();
    vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] });
    vi.doMock('@/composables/connection', () => ({
      useConnection: () => ({ isOnline }),
    }));
    vi.doMock('@/composables/ui', () => ({
      useUi: () => ({ isAppActive }),
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

  /** The first page loads, the next one fails `failures` times */
  function mockNextPageFailing(adapter, failures = Infinity) {
    let failuresLeft = failures;
    return vi.spyOn(adapter, 'fetchAccountTransactions')
      .mockImplementation(async (_, params) => {
        if (!params?.lastTxId) return page(['tx2'], { lastTxId: 'tx2' });
        if (failuresLeft > 0) {
          failuresLeft -= 1;
          throw new Error('HTTP 500');
        }
        return page(['tx1'], { lastTxId: 'tx1' });
      });
  }

  const getNextPageRequests = (fetchSpy) => fetchSpy.mock.calls
    .filter(([, params]) => params?.lastTxId === 'tx2');
  const getHashes = (list) => list.transactionsLoaded.value.map(({ hash }) => hash);

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

  it('requests a failed next page again by itself, until polling stops', async () => {
    vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval', 'setTimeout', 'clearTimeout'] });
    const fetchSpy = mockNextPageFailing(await getAdapter('bitcoin'), 1);
    const list = await useTransactionList({ accountAddress: 'bc1qtest', protocol: 'bitcoin' });

    await list.initializeTransactionListPolling();
    // The next page, as load-more asks for it
    await list.loadCurrentPageTransactions();
    expect(fetchSpy).toHaveBeenCalledTimes(2);

    await vi.advanceTimersByTimeAsync(POLLING_INTERVAL_TRANSACTIONS);
    // The retry of the page with its cursor, besides the poll of the first page
    expect(getNextPageRequests(fetchSpy)).toHaveLength(2);
    expect(getHashes(list)).toEqual(['tx2', 'tx1']);
    list.stopTransactionListPolling();
  });

  it('requests a failed next page again by itself after polling restarted', async () => {
    vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval', 'setTimeout', 'clearTimeout'] });
    const fetchSpy = mockNextPageFailing(await getAdapter('bitcoin'), 1);
    const list = await useTransactionList({ accountAddress: 'bc1qtest', protocol: 'bitcoin' });

    // The page was hidden and shown again
    await list.initializeTransactionListPolling();
    list.stopTransactionListPolling();
    await list.initializeTransactionListPolling();
    await list.loadCurrentPageTransactions();

    await vi.advanceTimersByTimeAsync(POLLING_INTERVAL_TRANSACTIONS);
    expect(getNextPageRequests(fetchSpy)).toHaveLength(2);
    expect(getHashes(list)).toEqual(['tx2', 'tx1']);
    list.stopTransactionListPolling();
  });

  it('drops a next page that comes after the polling started the list again', async () => {
    const adapter = await getAdapter('bitcoin');
    let firstPage = page(['tx2'], { lastTxId: 'tx2' });
    let resolveNextPage;
    const fetchSpy = vi.spyOn(adapter, 'fetchAccountTransactions')
      .mockImplementation(async (_, params) => (
        (params?.lastTxId === 'tx2')
          ? new Promise((resolve) => { resolveNextPage = resolve; })
          : firstPage
      ));
    const list = await useTransactionList({ accountAddress: 'bc1qtest', protocol: 'bitcoin' });

    await list.initializeTransactionListPolling();
    const loadingNextPage = list.loadCurrentPageTransactions();
    // A new transaction meanwhile
    firstPage = page(['tx3'], { lastTxId: 'tx3' });
    await vi.advanceTimersByTimeAsync(POLLING_INTERVAL_TRANSACTIONS);
    expect(getHashes(list)).toEqual(['tx3']);
    resolveNextPage(page(['tx1'], { lastTxId: 'tx1' }));
    await loadingNextPage;

    expect(getHashes(list)).toEqual(['tx3']);
    await list.loadCurrentPageTransactions();
    expect(fetchSpy.mock.lastCall[1]).toEqual({ lastTxId: 'tx3' });
    list.stopTransactionListPolling();
  });

  it('requests a failing first page once an interval, with the polling', async () => {
    vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval', 'setTimeout', 'clearTimeout'] });
    const adapter = await getAdapter('bitcoin');
    const fetchSpy = vi.spyOn(adapter, 'fetchAccountTransactions')
      .mockRejectedValue(new Error('HTTP 429'));
    const list = await useTransactionList({ accountAddress: 'bc1qtest', protocol: 'bitcoin' });

    await list.initializeTransactionListPolling();
    await vi.advanceTimersByTimeAsync(POLLING_INTERVAL_TRANSACTIONS * 3);

    expect(fetchSpy).toHaveBeenCalledTimes(1 + 3);
    list.stopTransactionListPolling();
  });

  it('retries a failed page only once the app shows again', async () => {
    vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval', 'setTimeout', 'clearTimeout'] });
    const fetchSpy = mockNextPageFailing(await getAdapter('bitcoin'), 1);
    const list = await useTransactionList({ accountAddress: 'bc1qtest', protocol: 'bitcoin' });

    await list.initializeTransactionListPolling();
    isAppActive.value = false;
    await list.loadCurrentPageTransactions();
    await vi.advanceTimersByTimeAsync(POLLING_INTERVAL_TRANSACTIONS * 3);
    expect(getNextPageRequests(fetchSpy)).toHaveLength(1);

    isAppActive.value = true;
    await vi.advanceTimersByTimeAsync(POLLING_INTERVAL_TRANSACTIONS);
    expect(getHashes(list)).toEqual(['tx2', 'tx1']);
    list.stopTransactionListPolling();
  });

  it('retries a failed page once the wallet is online again', async () => {
    vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval', 'setTimeout', 'clearTimeout'] });
    const fetchSpy = mockNextPageFailing(await getAdapter('bitcoin'), 1);
    const list = await useTransactionList({ accountAddress: 'bc1qtest', protocol: 'bitcoin' });

    await list.initializeTransactionListPolling();
    await list.loadCurrentPageTransactions();
    isOnline.value = false;
    await vi.advanceTimersByTimeAsync(POLLING_INTERVAL_TRANSACTIONS);
    expect(getNextPageRequests(fetchSpy)).toHaveLength(1);

    isOnline.value = true;
    await vi.advanceTimersByTimeAsync(POLLING_INTERVAL_TRANSACTIONS);
    expect(getNextPageRequests(fetchSpy)).toHaveLength(2);
    expect(getHashes(list)).toEqual(['tx2', 'tx1']);
    list.stopTransactionListPolling();
  });

  it('retries a failed page when the clock was set back meanwhile', async () => {
    vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval', 'setTimeout', 'clearTimeout'] });
    const fetchSpy = mockNextPageFailing(await getAdapter('bitcoin'), 1);
    const list = await useTransactionList({ accountAddress: 'bc1qtest', protocol: 'bitcoin' });

    await list.initializeTransactionListPolling();
    await list.loadCurrentPageTransactions();
    vi.setSystemTime(Date.now() - 60000);
    await vi.advanceTimersByTimeAsync(POLLING_INTERVAL_TRANSACTIONS);

    expect(getNextPageRequests(fetchSpy)).toHaveLength(2);
    expect(getHashes(list)).toEqual(['tx2', 'tx1']);
    list.stopTransactionListPolling();
  });

  it('does not retry a failed page after polling stops', async () => {
    vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval', 'setTimeout', 'clearTimeout'] });
    const fetchSpy = mockNextPageFailing(await getAdapter('bitcoin'));
    const list = await useTransactionList({ accountAddress: 'bc1qtest', protocol: 'bitcoin' });

    await list.initializeTransactionListPolling();
    await list.loadCurrentPageTransactions();
    list.stopTransactionListPolling();
    await vi.advanceTimersByTimeAsync(POLLING_INTERVAL_TRANSACTIONS * 3);

    expect(getNextPageRequests(fetchSpy)).toHaveLength(1);
  });

  it('does not retry a page that fails after polling stopped', async () => {
    vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval', 'setTimeout', 'clearTimeout'] });
    let failNextPage;
    const nextPage = new Promise((_, reject) => { failNextPage = reject; });
    nextPage.catch(() => {});
    const fetchSpy = vi.spyOn(await getAdapter('bitcoin'), 'fetchAccountTransactions')
      .mockImplementation(async (_, params) => (
        params?.lastTxId ? nextPage : page(['tx2'], { lastTxId: 'tx2' })
      ));
    const list = await useTransactionList({ accountAddress: 'bc1qtest', protocol: 'bitcoin' });

    await list.initializeTransactionListPolling();
    const loading = list.loadCurrentPageTransactions();
    list.stopTransactionListPolling();
    failNextPage(new Error('HTTP 500'));
    await loading;
    await vi.advanceTimersByTimeAsync(POLLING_INTERVAL_TRANSACTIONS * 3);

    expect(getNextPageRequests(fetchSpy)).toHaveLength(1);
  });

  it('stops loading when the dogecoin API answers with an HTTP error', async () => {
    // The retired sochain v2 answers every call with a JSON error
    vi.spyOn(global, 'fetch').mockImplementation(async () => new Response(
      JSON.stringify({ status: 'fail', data: { error_message: 'API v2 was retired.' } }),
      { status: 404 },
    ));
    const list = await useTransactionList({ accountAddress: 'DTestAddress', protocol: 'dogecoin' });

    await list.initializeTransactionListPolling();

    expect(list.isEndReached.value).toBe(false);
    expect(list.isLoading.value).toBe(false);
    expect(warnSpy).toHaveBeenCalledWith('Unknown rejection', expect.objectContaining({ statusCode: 404 }));
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

  it('ends the list when the next page comes back with the cursor it was requested with', async () => {
    const adapter = await getAdapter('bitcoin');
    const fetchSpy = vi.spyOn(adapter, 'fetchAccountTransactions')
      .mockResolvedValue(page(['tx1'], { lastTxId: 'tx1' }));
    const list = await useTransactionList({ accountAddress: 'bc1qtest', protocol: 'bitcoin' });

    await list.initializeTransactionListPolling();
    expect(list.isEndReached.value).toBe(false);

    await list.loadCurrentPageTransactions();
    expect(list.isEndReached.value).toBe(true);
    await list.loadCurrentPageTransactions();
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(list.transactionsLoaded.value.map(({ hash }) => hash)).toEqual(['tx1']);
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
