const environment = vi.hoisted(() => ({ IS_WEB: true }));
vi.mock('@/constants', async (importOriginal) => ({
  ...await importOriginal<typeof import('@/constants')>(),
  get IS_WEB() { return environment.IS_WEB; },
}));

const originalLocation = window.location;
let reload: ReturnType<typeof vi.fn>;

function missingChunk() {
  const event = new Event('vite:preloadError', { cancelable: true });
  window.dispatchEvent(event);
  return event;
}

describe('staleChunkReload', () => {
  let module: typeof import('@/lib/staleChunkReload');

  beforeEach(async () => {
    vi.useFakeTimers();
    sessionStorage.clear();
    reload = vi.fn();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...originalLocation, reload },
    });
    vi.resetModules();
    module = await import('@/lib/staleChunkReload');
  });

  afterEach(() => {
    window.removeEventListener('vite:preloadError', module.reloadOnStaleChunk);
    Object.defineProperty(window, 'location', { configurable: true, value: originalLocation });
    vi.useRealTimers();
    vi.restoreAllMocks();
    environment.IS_WEB = true;
  });

  it('reloads the web app once when a chunk is gone', () => {
    module.initStaleChunkReload();

    expect(missingChunk().defaultPrevented).toBe(true);
    expect(reload).toHaveBeenCalledOnce();
  });

  it('lets the error through when the chunk is gone again soon after', () => {
    module.initStaleChunkReload();
    missingChunk();
    vi.advanceTimersByTime(module.STALE_CHUNK_RELOAD_INTERVAL - 1);

    expect(missingChunk().defaultPrevented).toBe(false);
    expect(reload).toHaveBeenCalledOnce();
  });

  it('reloads again once the interval passed', () => {
    module.initStaleChunkReload();
    missingChunk();
    vi.advanceTimersByTime(module.STALE_CHUNK_RELOAD_INTERVAL);

    missingChunk();

    expect(reload).toHaveBeenCalledTimes(2);
  });

  it('does not reload when it cannot note the reload', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError');
    });
    module.initStaleChunkReload();

    expect(missingChunk().defaultPrevented).toBe(false);
    expect(reload).not.toHaveBeenCalled();
  });

  it('lets the error through while offline, and reloads once back online', () => {
    const onLine = vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    module.initStaleChunkReload();

    expect(missingChunk().defaultPrevented).toBe(false);
    expect(reload).not.toHaveBeenCalled();

    onLine.mockReturnValue(true);
    expect(missingChunk().defaultPrevented).toBe(true);
    expect(reload).toHaveBeenCalledOnce();
  });

  it('leaves the shipped chunks of the extension and the apps alone', () => {
    environment.IS_WEB = false;
    module.initStaleChunkReload();

    expect(missingChunk().defaultPrevented).toBe(false);
    expect(reload).not.toHaveBeenCalled();
  });
});
