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

  it('reads the storage again after a failed read instead of waiting for it', async () => {
    const { collectVuexState } = await import('@/migrations/migrationHelpers');
    globalThis.browser.storage.local.get = vi.fn()
      .mockRejectedValueOnce(new Error('Storage unavailable'))
      .mockResolvedValue({ state: { mnemonic: 'read-again' } });

    await expect(collectVuexState()).rejects.toThrow('Storage unavailable');
    expect(await collectVuexState()).toEqual({ mnemonic: 'read-again' });
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

describe('migrationHelpers: removeLegacySecrets', () => {
  let originalLocalStorageApi;

  beforeEach(() => {
    vi.resetModules();
    vi.doUnmock('@/constants');
  });

  afterEach(() => {
    globalThis.browser.storage.local = originalLocalStorageApi;
  });

  async function setup(entries) {
    const helpers = await import('@/migrations/migrationHelpers');
    const store = JSON.parse(JSON.stringify(entries));
    const pick = (keys) => [keys].flat().filter((key) => key in store);
    originalLocalStorageApi = globalThis.browser.storage.local;
    globalThis.browser.storage.local = {
      get: vi.fn(async (keys) => JSON.parse(JSON.stringify(
        Object.fromEntries(pick(keys).map((key) => [key, store[key]])),
      ))),
      set: vi.fn(async (items) => { Object.assign(store, JSON.parse(JSON.stringify(items))); }),
      remove: vi.fn(async (keys) => { pick(keys).forEach((key) => delete store[key]); }),
    };
    return { ...helpers, store, storage: globalThis.browser.storage.local };
  }

  it('writes nothing when there is no state and no entries', async () => {
    const { removeLegacySecrets, store, storage } = await setup({ other: 1 });

    await removeLegacySecrets({
      stateFields: { mnemonic: () => true },
      entries: { mnemonic: () => true },
    });

    expect(store).toEqual({ other: 1 });
    expect(storage.set).not.toHaveBeenCalled();
    expect(storage.remove).not.toHaveBeenCalled();
  });

  it('keeps the fields that each removal does not remove when they run at the same time', async () => {
    const { removeLegacySecrets, store } = await setup({
      state: { mnemonic: 'secret', invites: { invites: [] }, permissions: {} },
    });

    await Promise.all([
      removeLegacySecrets({ stateFields: { mnemonic: () => true } }),
      removeLegacySecrets({ stateFields: { invites: () => true } }),
    ]);

    expect(store).toEqual({ state: { permissions: {} } });
  });

  it('asks to confirm the removal only when there is something to remove', async () => {
    const { removeLegacySecrets } = await setup({ state: { permissions: {} }, other: 1 });
    const confirm = vi.fn().mockResolvedValue(true);

    await removeLegacySecrets({
      stateFields: { mnemonic: () => true },
      entries: { mnemonic: () => true },
      confirm,
    });

    expect(confirm).not.toHaveBeenCalled();
  });

  it('removes nothing when the removal is not confirmed', async () => {
    const entries = { state: { mnemonic: 'secret' }, mnemonic: 'secret' };
    const { removeLegacySecrets, store, storage } = await setup(entries);

    await removeLegacySecrets({
      stateFields: { mnemonic: () => true },
      entries: { mnemonic: () => true },
      confirm: async () => false,
    });

    expect(store).toEqual(entries);
    expect(storage.set).not.toHaveBeenCalled();
    expect(storage.remove).not.toHaveBeenCalled();
  });

  it('does not touch the browser storage in the offscreen document', async () => {
    vi.doMock('@/constants', async () => ({
      ...await vi.importActual('@/constants'),
      IS_OFFSCREEN_TAB: true,
    }));
    const { removeLegacySecrets, store, storage } = await setup({
      state: { mnemonic: 'secret' },
      mnemonic: 'secret',
    });

    await removeLegacySecrets({
      stateFields: { mnemonic: () => true },
      entries: { mnemonic: () => true },
    });

    expect(storage.get).not.toHaveBeenCalled();
    expect(store).toEqual({ state: { mnemonic: 'secret' }, mnemonic: 'secret' });
  });
});
