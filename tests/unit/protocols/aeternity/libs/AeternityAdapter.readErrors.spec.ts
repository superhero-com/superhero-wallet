// @ts-nocheck
/**
 * Read-side API failures must reject (or return `null`) instead of resolving with an empty
 * value, so the callers can keep the last known data.
 */
let getBalanceMock;
let setAeNodeErrorMock;

describe('AeternityAdapter read errors', () => {
  beforeEach(async () => {
    vi.resetModules();
    getBalanceMock = vi.fn();
    setAeNodeErrorMock = vi.fn();
    vi.doMock('@/composables/aeSdk', () => ({
      useAeSdk: () => ({
        getAeSdk: async () => ({ getBalance: getBalanceMock }),
        setAeNodeError: setAeNodeErrorMock,
      }),
    }));
    await import('@/protocols/registerAdapters');
  });

  afterEach(() => {
    vi.doUnmock('@/composables/aeSdk');
    vi.restoreAllMocks();
  });

  async function getAdapter() {
    const { AeternityAdapter } = await import('@/protocols/aeternity/libs/AeternityAdapter');
    return new AeternityAdapter();
  }

  it('fetchBalance resolves the balance in AE and clears the node error', async () => {
    getBalanceMock.mockResolvedValue('1500000000000000000');
    const adapter = await getAdapter();

    await expect(adapter.fetchBalance('ak_test')).resolves.toBe('1.5');
    expect(setAeNodeErrorMock).toHaveBeenCalledWith(false);
  });

  it('fetchBalance rejects when the node fails, after flagging the node error', async () => {
    const error = new Error('socket hang up');
    getBalanceMock.mockRejectedValue(error);
    const adapter = await getAdapter();

    await expect(adapter.fetchBalance('ak_test')).rejects.toBe(error);
    expect(setAeNodeErrorMock).toHaveBeenCalledWith(true);
  });

  it('fetchAccountTokenBalances returns null when the middleware fails', async () => {
    vi.spyOn(global, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'));
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const adapter = await getAdapter();

    expect(await adapter.fetchAccountTokenBalances('ak_test')).toBeNull();
  });
});
