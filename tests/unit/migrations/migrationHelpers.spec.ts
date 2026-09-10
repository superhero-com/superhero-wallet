// @ts-nocheck
/**
 * `collectVuexState` is a module-level singleton cache with a concurrency
 * guard (`isCollecting`): every migration that needs the legacy Vuex blob
 * calls it, and several migrations can run their restore step around the
 * same time, so a race here could make one migration see a torn/partial
 * read or trigger redundant `browser.storage.local.get` calls.
 *
 * NOTE: something in this module's import chain re-establishes
 * `globalThis.browser` as a new object each time the module graph is
 * re-evaluated after `vi.resetModules()`, so the mock is installed AFTER
 * the dynamic import below (installing it before gets silently discarded).
 */
describe('migrationHelpers: collectVuexState', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('reads the legacy state from browser storage exactly once for concurrent callers', async () => {
    const { collectVuexState } = await import('@/migrations/migrationHelpers');

    let resolveGet;
    const getMock = vi.fn(() => new Promise((resolve) => { resolveGet = resolve; }));
    globalThis.browser.storage.local.get = getMock;

    const call1 = collectVuexState();
    const call2 = collectVuexState();
    expect(getMock).toHaveBeenCalledTimes(1);

    resolveGet({ state: { mnemonic: 'shared-value' } });
    const [result1, result2] = await Promise.all([call1, call2]);

    expect(result1).toEqual({ mnemonic: 'shared-value' });
    expect(result2).toBe(result1);
    expect(getMock).toHaveBeenCalledTimes(1);
  });

  it('caches the result so a later call does not re-read storage', async () => {
    const { collectVuexState } = await import('@/migrations/migrationHelpers');

    const getMock = vi.fn().mockResolvedValue({ state: { mnemonic: 'cached-value' } });
    globalThis.browser.storage.local.get = getMock;

    await collectVuexState();
    await collectVuexState();

    expect(getMock).toHaveBeenCalledTimes(1);
  });

  it('resolves to undefined without reading storage when there is no `browser` global (offscreen/non-extension context)', async () => {
    const { collectVuexState } = await import('@/migrations/migrationHelpers');
    const originalBrowser = globalThis.browser;
    // @ts-expect-error - simulating an environment with no webextension browser API
    delete globalThis.browser;

    try {
      const result = await collectVuexState();
      expect(result).toBeUndefined();
    } finally {
      globalThis.browser = originalBrowser;
    }
  });
});
