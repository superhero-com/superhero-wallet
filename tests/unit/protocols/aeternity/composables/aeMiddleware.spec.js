import { computed, ref } from 'vue';

const MDW_TESTNET = 'https://mdw.testnet.test';
const MDW_MAINNET = 'https://mdw.mainnet.test';

function jsonResponse(body, status = 200) {
  return new Response(typeof body === 'string' ? body : JSON.stringify(body), { status });
}

async function loadComposable(respond) {
  vi.resetModules();
  const middlewareUrl = ref(MDW_TESTNET);
  vi.doMock('../../../../../src/protocols/aeternity/composables/aeNetworkSettings', () => ({
    useAeNetworkSettings: () => ({
      aeActiveNetworkSettings: computed(() => ({ middlewareUrl: middlewareUrl.value })),
    }),
  }));
  const fetchMock = vi.fn(async (url) => respond(url));
  vi.stubGlobal('fetch', fetchMock);

  const { useAeMiddleware } = await import('@/protocols/aeternity/composables/aeMiddleware');
  return {
    middleware: useAeMiddleware(),
    middlewareUrl,
    requestedUrls: () => fetchMock.mock.calls.map(([url]) => url),
  };
}

describe('useAeMiddleware', () => {
  afterEach(() => {
    vi.doUnmock('../../../../../src/protocols/aeternity/composables/aeNetworkSettings');
    vi.unstubAllGlobals();
  });

  it('asks the middleware of the network active at the time of the request', async () => {
    const ctx = await loadComposable(() => jsonResponse({ mdw_version: '1.110.0' }));

    await ctx.middleware.fetchMiddlewareStatus();
    ctx.middlewareUrl.value = MDW_MAINNET;
    await ctx.middleware.fetchMiddlewareStatus();

    expect(ctx.requestedUrls()).toEqual([
      `${MDW_TESTNET}/v3/status`,
      `${MDW_MAINNET}/v3/status`,
    ]);
  });

  it('reads a transaction with its keys camelCased and its big amounts exact', async () => {
    const ctx = await loadComposable(() => jsonResponse(
      '{"hash":"th_1","block_height":5,"tx":{"caller_id":"ak_1","amount":1319312684803176974291}}',
    ));

    const transaction = await ctx.middleware.fetchTransaction('th_1');

    expect(ctx.requestedUrls()).toEqual([`${MDW_TESTNET}/v3/transactions/th_1`]);
    expect(transaction).toEqual({
      hash: 'th_1',
      blockHeight: 5,
      tx: { callerId: 'ak_1', amount: '1319312684803176974291' },
    });
  });

  it('filters the transactions by the given query', async () => {
    const ctx = await loadComposable(() => jsonResponse({ data: [{ hash: 'th_1' }], next: null }));

    const { data } = await ctx.middleware.fetchTransactions({
      contract: 'ct_vault', direction: 'backward', limit: 1,
    });

    expect(ctx.requestedUrls()).toEqual([
      `${MDW_TESTNET}/v3/transactions?contract=ct_vault&direction=backward&limit=1`,
    ]);
    expect(data).toEqual([{ hash: 'th_1' }]);
  });

  it('keeps a hash in its path segment', async () => {
    const ctx = await loadComposable(() => jsonResponse({ error: 'not found' }, 404));

    await ctx.middleware.fetchTransaction('../../key-blocks#').catch(() => {});
    await ctx.middleware.fetchNameByHash('../key-blocks#').catch(() => {});

    expect(ctx.requestedUrls()).toEqual([
      `${MDW_TESTNET}/v3/transactions/..%2F..%2Fkey-blocks%23`,
      `${MDW_TESTNET}/v3/names/..%2Fkey-blocks%23`,
      `${MDW_TESTNET}/v3/names/auctions/..%2Fkey-blocks%23`,
    ]);
  });

  it('rejects with the status code the middleware answered with', async () => {
    const ctx = await loadComposable(() => jsonResponse({ error: 'not found' }, 404));

    await expect(ctx.middleware.fetchTransaction('th_missing'))
      .rejects.toMatchObject({ statusCode: 404 });
  });

  describe('fetchNameByHash', () => {
    it('resolves the name of a name hash', async () => {
      const ctx = await loadComposable(() => jsonResponse({ name: 'owned.chain' }));

      expect(await ctx.middleware.fetchNameByHash('nm_owned')).toBe('owned.chain');
      expect(ctx.requestedUrls()).toEqual([`${MDW_TESTNET}/v3/names/nm_owned`]);
    });

    it('finds a name in its first auction among the auctions', async () => {
      const ctx = await loadComposable((url) => (url.includes('/names/auctions/')
        ? jsonResponse({ name: 'bidding.chain', auction_end: 1000 })
        : jsonResponse({ error: 'not found' }, 404)));

      expect(await ctx.middleware.fetchNameByHash('nm_bidding')).toBe('bidding.chain');
      expect(ctx.requestedUrls()).toEqual([
        `${MDW_TESTNET}/v3/names/nm_bidding`,
        `${MDW_TESTNET}/v3/names/auctions/nm_bidding`,
      ]);
    });

    it('does not look among the auctions when the middleware fails', async () => {
      const ctx = await loadComposable(() => jsonResponse('Service Unavailable', 503));

      await expect(ctx.middleware.fetchNameByHash('nm_owned'))
        .rejects.toMatchObject({ statusCode: 503 });
      expect(ctx.requestedUrls()).toEqual([`${MDW_TESTNET}/v3/names/nm_owned`]);
    });
  });
});
