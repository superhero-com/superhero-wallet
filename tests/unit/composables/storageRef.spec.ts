// @ts-nocheck
describe('useStorageRef', () => {
  let storage;

  beforeEach(() => {
    // The setup files already loaded it with the real storage.
    vi.resetModules();
    storage = { get: vi.fn(), set: vi.fn() };
    vi.doMock('@/lib/WalletStorage', () => ({ WalletStorage: storage }));
  });

  /** Resolves the state once it is restored from the stored value. */
  async function restore(options = {}) {
    const { useStorageRef } = await import('@/composables/storageRef');
    return new Promise((resolve) => {
      const state = useStorageRef('initial', 'key', {
        ...options,
        onRestored: () => resolve(state),
      });
    });
  }

  it('does not write back a value its migrations leave as it was', async () => {
    storage.get.mockResolvedValue({ version: 1 });

    const state = await restore({ migrations: [async (value) => ({ ...value })] });

    expect(state.value).toEqual({ version: 1 });
    expect(storage.set).not.toHaveBeenCalled();
  });

  it('writes back once a value its migrations changed, also in place', async () => {
    storage.get.mockResolvedValue({ version: 1 });

    const state = await restore({
      migrations: [async (value) => Object.assign(value, { version: 2 })],
    });

    expect(state.value).toEqual({ version: 2 });
    expect(storage.set.mock.calls).toEqual([['key', { version: 2 }]]);
  });
});
