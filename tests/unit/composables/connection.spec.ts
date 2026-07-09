// @ts-nocheck
/**
 * `useConnection` keeps its `isOnline` ref and "already watching" flag at module scope,
 * so each test re-imports it fresh to avoid stale listeners/state leaking between tests.
 */
describe('useConnection', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('reflects the current navigator.onLine value on creation', async () => {
    const { useConnection } = await import('@/composables/connection');
    const { isOnline } = useConnection();

    expect(isOnline.value).toBe(window.navigator.onLine);
  });

  it('only updates isOnline on window online/offline events after watchConnectionStatus() is called', async () => {
    const { useConnection } = await import('@/composables/connection');
    const { isOnline, watchConnectionStatus } = useConnection();

    // Not watching yet - dispatching events has no effect.
    window.dispatchEvent(new Event('offline'));
    expect(isOnline.value).toBe(window.navigator.onLine);

    watchConnectionStatus();

    window.dispatchEvent(new Event('offline'));
    expect(isOnline.value).toBe(false);

    window.dispatchEvent(new Event('online'));
    expect(isOnline.value).toBe(true);
  });

  it('shares the isOnline state between multiple useConnection() calls', async () => {
    const { useConnection } = await import('@/composables/connection');
    const first = useConnection();
    const second = useConnection();

    first.watchConnectionStatus();
    window.dispatchEvent(new Event('offline'));

    expect(second.isOnline.value).toBe(false);
  });
});
