// @ts-nocheck
describe('useStorageRef', () => {
  let storage;
  let loggerWrite;

  beforeEach(() => {
    // The setup files already loaded it with the real storage.
    vi.resetModules();
    storage = { get: vi.fn(), set: vi.fn() };
    vi.doMock('@/lib/WalletStorage', () => ({ WalletStorage: storage }));
    loggerWrite = vi.fn();
    vi.doMock('@/lib/logger', () => ({ default: { write: loggerWrite } }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
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

  it.each([
    ['the stored value can not be read', () => {
      storage.get.mockRejectedValue(new Error('Keystore operation failed'));
      return [];
    }],
    ['a migration fails', () => {
      storage.get.mockResolvedValue({ version: 1 });
      return [async () => { throw new Error('Keystore operation failed'); }];
    }],
  ])('keeps the initial value and reports it when %s', async (_, setUp) => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const migrations = setUp();
    const { useStorageRef } = await import('@/composables/storageRef');
    const calls = [];
    let state;

    await new Promise((resolve) => {
      state = useStorageRef('initial', 'key', {
        migrations,
        onRestoreFailed: (error) => calls.push(['failed', error]),
        onRestored: (value) => {
          calls.push(['restored', value]);
          resolve();
        },
      });
    });

    // Failed first, so whoever waits for the restore sees the failure.
    expect(calls).toEqual([
      ['failed', new Error('Keystore operation failed')],
      ['restored', null],
    ]);
    expect(state.value).toBe('initial');
    expect(storage.set).not.toHaveBeenCalled();

    // Whoever handles the failure guards its own writes.
    state.value = 'changed';
    await vi.waitFor(() => expect(storage.set.mock.calls).toEqual([['key', 'changed']]));
  });

  it('keeps a value it could not read as it is stored when nobody handles the failure', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    storage.get.mockRejectedValue(new Error('Keystore operation failed'));

    const state = await restore();
    state.value = 'changed';
    await new Promise((resolve) => { setTimeout(resolve, 0); });

    expect(state.value).toBe('changed');
    expect(storage.set).not.toHaveBeenCalled();
  });

  it('writes a failed read to the error log, without a modal', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    storage.get.mockRejectedValue(new Error('Keystore operation failed'));

    await restore();

    await vi.waitFor(() => expect(loggerWrite).toHaveBeenCalledWith({
      message: 'Reading "key" from the storage failed: Keystore operation failed',
      stack: expect.stringContaining('Keystore operation failed'),
      type: 'api-response',
      modal: false,
    }));
  });
});
