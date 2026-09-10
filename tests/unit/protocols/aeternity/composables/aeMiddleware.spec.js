import { computed, ref } from 'vue';

/**
 * `getMiddleware` concurrency. The middleware ref keeps the PREVIOUS network's client
 * until an init finishes, so a caller arriving mid-switch must wait for the init rather
 * than for the ref to be truthy - otherwise it fetches the network the user just left.
 */
const MDW_TESTNET = 'https://mdw.testnet.test';
// Mirrors `INIT_TIMEOUT` in the composable.
const INIT_TIMEOUT = 30000;
const MDW_MAINNET = 'https://mdw.mainnet.test';

async function loadComposable() {
  vi.resetModules();

  const middlewareUrl = ref(MDW_TESTNET);
  const fetchJson = vi.fn(async () => ({ spec: true }));
  // Resolves on a later tick so a second caller can arrive while the init is in flight.
  const genSwaggerClient = vi.fn(async (url) => new Promise((resolve) => {
    setTimeout(() => resolve({ api: { url } }), 0);
  }));

  vi.doMock('@/utils', async (importOriginal) => ({
    ...await importOriginal(),
    fetchJson,
  }));
  vi.doMock('@/lib/swagger', () => ({
    genSwaggerClient,
    mapObject: (obj) => obj,
  }));
  vi.doMock('../../../../../src/protocols/aeternity/composables/aeNetworkSettings', () => ({
    useAeNetworkSettings: () => ({
      aeActiveNetworkSettings: computed(() => ({ middlewareUrl: middlewareUrl.value })),
    }),
  }));

  const { useAeMiddleware } = await import('@/protocols/aeternity/composables/aeMiddleware');
  return {
    composable: useAeMiddleware(),
    middlewareUrl,
    fetchJson,
    genSwaggerClient,
  };
}

describe('useAeMiddleware getMiddleware', () => {
  it('makes a caller arriving mid-switch wait for the new network\'s client', async () => {
    const ctx = await loadComposable();
    await ctx.composable.getMiddleware();

    ctx.middlewareUrl.value = MDW_MAINNET;
    const [first, second] = await Promise.all([
      ctx.composable.getMiddleware(),
      ctx.composable.getMiddleware(),
    ]);

    expect(first.url).toBe(MDW_MAINNET);
    expect(second.url).toBe(MDW_MAINNET);
    // The waiter reuses the in-flight init instead of starting a second one.
    expect(ctx.genSwaggerClient).toHaveBeenCalledTimes(2);
  });

  it('retries the init after a failed one instead of serving the old client forever', async () => {
    const ctx = await loadComposable();
    await ctx.composable.getMiddleware();

    ctx.middlewareUrl.value = MDW_MAINNET;
    ctx.fetchJson.mockRejectedValueOnce(new Error('middleware unreachable'));
    await expect(ctx.composable.getMiddleware()).rejects.toThrow('middleware unreachable');

    const retried = await ctx.composable.getMiddleware();

    expect(retried.url).toBe(MDW_MAINNET);
  });

  it('does not record the new network when building the client is what failed', async () => {
    // Recording the settings before the client is live makes a failed init look like a
    // completed switch, so the URL check passes and the previous client is served on.
    const ctx = await loadComposable();
    await ctx.composable.getMiddleware();

    ctx.middlewareUrl.value = MDW_MAINNET;
    ctx.genSwaggerClient.mockRejectedValueOnce(new Error('spec is not a swagger doc'));
    await expect(ctx.composable.getMiddleware()).rejects.toThrow('spec is not a swagger doc');

    const retried = await ctx.composable.getMiddleware();

    expect(retried.url).toBe(MDW_MAINNET);
  });

  it('keys the client to the network it was built for, not the one current when it lands', async () => {
    // The settings are read once at the start of the init. Reading them again at the end
    // would file a mainnet client under testnet and never re-init for testnet again.
    const ctx = await loadComposable();
    await ctx.composable.getMiddleware();

    let releaseInit;
    ctx.genSwaggerClient.mockImplementationOnce(async (url) => new Promise((resolve) => {
      releaseInit = () => resolve({ api: { url } });
    }));

    ctx.middlewareUrl.value = MDW_MAINNET;
    const pendingMainnet = ctx.composable.getMiddleware();
    await vi.waitFor(() => expect(releaseInit).toBeTypeOf('function'));
    // The user switches back before the mainnet client finishes building.
    ctx.middlewareUrl.value = MDW_TESTNET;
    releaseInit();

    expect((await pendingMainnet).url).toBe(MDW_MAINNET);
    expect((await ctx.composable.getMiddleware()).url).toBe(MDW_TESTNET);
  });

  it('shares a single retry among every waiter after a failed concurrent init', async () => {
    // Three callers arrive while one init is in flight; it fails. Only the caller that
    // owns the attempt sees it reject - the other two must join a shared retry instead
    // of each starting their own, or a struggling middleware gets hit with N requests
    // instead of one.
    const ctx = await loadComposable();
    await ctx.composable.getMiddleware();

    ctx.middlewareUrl.value = MDW_MAINNET;
    ctx.fetchJson.mockRejectedValueOnce(new Error('middleware unreachable'));

    await Promise.allSettled([
      ctx.composable.getMiddleware(),
      ctx.composable.getMiddleware(),
      ctx.composable.getMiddleware(),
    ]);

    // 1 initial setup + 1 shared retry after the rejection. A caller per-waiter retry
    // bug would instead produce 3 (each of the two waiters retrying on its own).
    expect(ctx.genSwaggerClient).toHaveBeenCalledTimes(2);
  });

  it('gives up on an init that never settles instead of blocking every consumer', async () => {
    vi.useFakeTimers();
    try {
      const ctx = await loadComposable();
      ctx.fetchJson.mockImplementationOnce(() => new Promise(() => {}));

      const timedOut = expect(ctx.composable.getMiddleware())
        .rejects.toThrow('Middleware init timed out');
      await vi.advanceTimersByTimeAsync(INIT_TIMEOUT);
      await timedOut;

      // The failed attempt must not leave a promise behind that later callers await.
      const recovered = ctx.composable.getMiddleware();
      await vi.advanceTimersByTimeAsync(0);
      expect((await recovered).url).toBe(MDW_TESTNET);
    } finally {
      vi.useRealTimers();
    }
  });
});
