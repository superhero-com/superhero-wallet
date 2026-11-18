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

  describe('a migrated value that could not be stored', () => {
    const migrations = [async (value) => ({ ...value, version: 2 })];
    /** The restored value is applied with the watcher off until the next task. */
    const watcherEnabled = () => new Promise((resolve) => { setTimeout(resolve, 0); });

    beforeEach(() => {
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      storage.get.mockResolvedValue({ version: 1 });
      vi.doMock('@/lib/SecureMobileStorage', () => ({ SecureMobileStorage: storage }));
      vi.doMock('@/constants', async (importOriginal) => ({
        ...await importOriginal(),
        IS_MOBILE_APP: true,
      }));
    });

    afterEach(() => {
      vi.doUnmock('@/lib/SecureMobileStorage');
      vi.doUnmock('@/constants');
    });

    it('keeps a secret in memory, as the original may be gone, and stores it on retry', async () => {
      storage.set.mockRejectedValueOnce(new Error('Keychain write failed'));
      const onRestoreFailed = vi.fn();

      const state = await restore({ migrations, enableSecureStorage: true, onRestoreFailed });

      // Not reported as unreadable, which would offer a reset.
      expect(onRestoreFailed).not.toHaveBeenCalled();
      expect(state.value).toEqual({ version: 2 });
      await vi.waitFor(() => expect(loggerWrite).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Saving the updated "key" failed: Keychain write failed',
      })));
      const { hasFailedMigrationWrites, retryFailedMigrationWrites } = await import('@/composables/storageRef');
      expect(hasFailedMigrationWrites()).toBe(true);

      await retryFailedMigrationWrites();
      expect(storage.set.mock.calls).toEqual([['key', { version: 2 }], ['key', { version: 2 }]]);
      expect(hasFailedMigrationWrites()).toBe(false);
    });

    it('retries with a later change whose own write failed too', async () => {
      storage.set
        .mockRejectedValueOnce(new Error('Keychain write failed'))
        .mockRejectedValueOnce(new Error('Keychain write failed'));
      const state = await restore({ migrations, enableSecureStorage: true });
      await watcherEnabled();
      state.value = { version: 3 };
      await vi.waitFor(() => expect(storage.set).toHaveBeenCalledTimes(2));
      const { retryFailedMigrationWrites } = await import('@/composables/storageRef');

      await retryFailedMigrationWrites();
      expect(storage.set).toHaveBeenCalledTimes(3);
      expect(storage.set).toHaveBeenLastCalledWith('key', { version: 3 });
    });

    it('is no longer reported once a later change of its own is stored', async () => {
      storage.set.mockRejectedValueOnce(new Error('Keychain write failed'));
      const state = await restore({ migrations, enableSecureStorage: true });
      const { hasFailedMigrationWrites } = await import('@/composables/storageRef');
      expect(hasFailedMigrationWrites()).toBe(true);

      await watcherEnabled();
      state.value = { version: 3 };
      await vi.waitFor(() => expect(hasFailedMigrationWrites()).toBe(false));
      expect(storage.set).toHaveBeenLastCalledWith('key', { version: 3 });
    });

    it('only logs a value outside the secure storage, whose original is migrated again', async () => {
      storage.set.mockRejectedValueOnce(new Error('Quota exceeded'));
      const state = await restore({ migrations });

      expect(state.value).toEqual({ version: 2 });
      const { hasFailedMigrationWrites } = await import('@/composables/storageRef');
      expect(hasFailedMigrationWrites()).toBe(false);
    });
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

  it('writes a failed save to the error log, without a modal', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    storage.get.mockResolvedValue('stored');
    storage.set.mockRejectedValue(new Error('QuotaExceededError'));

    const state = await restore();
    // Its watcher is set up right after the restore.
    await new Promise((resolve) => { setTimeout(resolve, 0); });
    state.value = 'changed';

    await vi.waitFor(() => expect(loggerWrite).toHaveBeenCalledWith({
      message: 'Saving "key" failed: QuotaExceededError',
      stack: expect.stringContaining('QuotaExceededError'),
      type: 'api-response',
      modal: false,
    }));
  });
});

describe('useStorageRef over the vault', () => {
  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
    vi.doUnmock('@/lib/WalletStorage');
    vi.doMock('@/constants', async (importOriginal) => ({
      ...await importOriginal(),
      IS_MOBILE_APP: false,
    }));
  });

  afterEach(() => {
    vi.doUnmock('@/constants');
    vi.restoreAllMocks();
  });

  it('keeps the decoded salt through commits of other fields, so its watchers see no change', async () => {
    const { watch } = await import('vue');
    const { STORAGE_KEYS } = await import('@/constants');
    const vault = await import('@/lib/WalletVault');
    const { decodeBase64, encodeBase64, generateSalt } = await import('@/utils/crypto');
    const { useStorageRef } = await import('@/composables/storageRef');
    const firstSalt = encodeBase64(generateSalt());
    await vault.writeVaultField(STORAGE_KEYS.encryptionSalt, firstSalt);
    const salt = await new Promise((resolve) => {
      const state = useStorageRef(null, STORAGE_KEYS.encryptionSalt, {
        serializer: {
          write: (value) => encodeBase64(value),
          read: (value) => (value ? decodeBase64(value) : null),
        },
        onRestored: () => resolve(state),
      });
    });
    const decoded = salt.value;
    const changes = vi.fn();
    watch(salt, changes, { flush: 'sync' });

    await vault.writeVaultField(STORAGE_KEYS.secureLoginTimeout, 'another-field');
    expect(salt.value).toBe(decoded);
    expect(changes).not.toHaveBeenCalled();

    const secondSalt = encodeBase64(generateSalt());
    await vault.writeVaultField(STORAGE_KEYS.encryptionSalt, secondSalt);
    expect(changes).toHaveBeenCalledTimes(1);
    expect(encodeBase64(salt.value)).toBe(secondSalt);
  });

  it('keeps a migrated value it could not store, whose original is migrated again, without a retry', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.doMock('@/lib/logger', () => ({ default: { write: vi.fn() } }));
    const { IDBObjectStore } = await import('fake-indexeddb');
    const { STORAGE_KEYS } = await import('@/constants');
    const vault = await import('@/lib/WalletVault');
    const { hasFailedMigrationWrites, useStorageRef } = await import('@/composables/storageRef');
    vi.spyOn(IDBObjectStore.prototype, 'put').mockImplementationOnce(() => {
      throw new DOMException('Vault quota exceeded', 'QuotaExceededError');
    });

    const state = await new Promise((resolve) => {
      const mnemonic = useStorageRef('', STORAGE_KEYS.mnemonic, {
        migrations: [async () => 'migrated-mnemonic'],
        onRestored: () => resolve(mnemonic),
      });
    });

    expect(state.value).toBe('migrated-mnemonic');
    expect(vault.readVault().values[STORAGE_KEYS.mnemonic]).toBeNull();
    expect(hasFailedMigrationWrites()).toBe(false);
    vi.doUnmock('@/lib/logger');
  });
});

describe('useStorageRef synced with other windows', () => {
  const ITEM_KEY = 'sh-wallet_key';
  let storageListeners;

  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
    vi.doUnmock('@/lib/WalletStorage');
    vi.doUnmock('@/lib/logger');
    storageListeners = [];
    const addEventListener = window.addEventListener.bind(window);
    vi.spyOn(window, 'addEventListener').mockImplementation((type, listener, ...rest) => {
      if (type === 'storage') storageListeners.push(listener);
      addEventListener(type, listener, ...rest);
    });
  });

  afterEach(() => {
    storageListeners.forEach((listener) => window.removeEventListener('storage', listener));
    vi.doUnmock('@/constants');
    vi.restoreAllMocks();
  });

  const nextTask = () => new Promise((resolve) => { setTimeout(resolve, 0); });

  function storeInOtherWindow(raw, { key = ITEM_KEY, storageArea = localStorage } = {}) {
    if (raw !== null && storageArea === localStorage) localStorage.setItem(key, raw);
    window.dispatchEvent(new StorageEvent('storage', { key, newValue: raw, storageArea }));
  }

  async function restore(options = {}, key = 'key') {
    const { useStorageRef } = await import('@/composables/storageRef');
    const state = await new Promise((resolve) => {
      const ref = useStorageRef({ list: [] }, key, {
        syncWithOtherWindows: true,
        ...options,
        onRestored: () => resolve(ref),
      });
    });
    await nextTask();
    return state;
  }

  it('follows a value another window stores, without writing it back', async () => {
    localStorage.setItem(ITEM_KEY, '{"list":[1]}');
    const state = await restore();

    storeInOtherWindow('{"list":[1,2]}');
    // Before its watcher runs
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    await nextTask();

    expect(state.value).toEqual({ list: [1, 2] });
    expect(setItem).not.toHaveBeenCalled();
  });

  it('saves a change made right after a value of another window', async () => {
    const state = await restore();

    storeInOtherWindow('{"list":[1]}');
    state.value.list.push(2);
    await nextTask();

    expect(localStorage.getItem(ITEM_KEY)).toBe('{"list":[1,2]}');
  });

  it('saves a change back to the value another window stored before', async () => {
    const state = await restore();
    storeInOtherWindow('{"list":[1]}');
    state.value = { list: [1, 2] };
    await nextTask();

    state.value = { list: [1] };
    await nextTask();

    expect(localStorage.getItem(ITEM_KEY)).toBe('{"list":[1]}');
  });

  it('does not write an unchanged value over a newer one of another window', async () => {
    localStorage.setItem(ITEM_KEY, '{"list":[1]}');
    const state = await restore();
    // Stored there, its event is still on the way.
    localStorage.setItem(ITEM_KEY, '{"list":[1,2]}');

    state.value = { list: [1] };
    await nextTask();

    expect(localStorage.getItem(ITEM_KEY)).toBe('{"list":[1,2]}');
  });

  it('keeps its own later save when the event of an earlier one arrives', async () => {
    const state = await restore();
    state.value.list.push('Bob');
    await nextTask();

    // Stored by another window before the save above, its event comes after it.
    window.dispatchEvent(new StorageEvent('storage', {
      key: ITEM_KEY, newValue: '{"list":["Alice"]}', storageArea: localStorage,
    }));
    expect(state.value).toEqual({ list: ['Bob'] });

    state.value.list.push('Carol');
    await nextTask();
    expect(localStorage.getItem(ITEM_KEY)).toBe('{"list":["Bob","Carol"]}');
  });

  it('follows a value another window stored while its own save failed', async () => {
    const state = await restore();
    const { setItem } = Storage.prototype;
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(function storeOtherAndFail(key) {
      setItem.call(this, key, '{"list":["W"]}');
      throw new DOMException('Full', 'QuotaExceededError');
    });

    state.value.list.push('X');
    await nextTask();
    storeInOtherWindow('{"list":["W"]}');

    expect(state.value).toEqual({ list: ['W'] });
  });

  /** The ref's next save fails, e.g. as the storage is full. Other keys' saves still work. */
  function failNextSave() {
    const { setItem } = Storage.prototype;
    let hasFailed = false;
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function failOnce(key, value) {
      if (key === ITEM_KEY && !hasFailed) {
        hasFailed = true;
        throw new DOMException('Full', 'QuotaExceededError');
      }
      return setItem.call(this, key, value);
    });
  }

  it('saves a value again after its save failed', async () => {
    const state = await restore();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    failNextSave();
    state.value.list.push('X');
    await nextTask();
    expect(localStorage.getItem(ITEM_KEY)).toBeNull();

    state.value = { list: ['X'] };
    await nextTask();

    expect(localStorage.getItem(ITEM_KEY)).toBe('{"list":["X"]}');
  });

  it('follows another window after its own value could not be read', async () => {
    localStorage.setItem(ITEM_KEY, '{');
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { useStorageRef } = await import('@/composables/storageRef');
    const onRestored = vi.fn();
    // The failed read calls it before this returns, so `restore` can't be used.
    const state = useStorageRef({ list: [] }, 'key', { syncWithOtherWindows: true, onRestored });
    await vi.waitFor(() => expect(onRestored).toHaveBeenCalled());

    storeInOtherWindow('{"list":[1]}');

    expect(state.value).toEqual({ list: [1] });
  });

  it('keeps its migrated value when storing it failed', async () => {
    localStorage.setItem(ITEM_KEY, '{"list":[1]}');
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    failNextSave();

    const state = await restore({ migrations: [(value) => ({ ...value, version: 2 })] });

    expect(localStorage.getItem(ITEM_KEY)).toBe('{"list":[1]}');
    expect(state.value).toEqual({ list: [1], version: 2 });
  });

  it('follows other windows in the offscreen tab, not an event older than its own save', async () => {
    vi.doMock('@/constants', async (importOriginal) => ({
      ...await importOriginal(),
      IS_OFFSCREEN_TAB: true,
    }));
    const state = await restore({ backgroundSync: true });
    storeInOtherWindow('{"list":["Alice"]}');
    expect(state.value).toEqual({ list: ['Alice'] });
    state.value.list.push('Bob');
    await nextTask();

    // Stored by another window before the save above, its event comes after it.
    window.dispatchEvent(new StorageEvent('storage', {
      key: ITEM_KEY, newValue: '{"list":["Carol"]}', storageArea: localStorage,
    }));
    await nextTask();

    expect(state.value).toEqual({ list: ['Alice', 'Bob'] });
    expect(localStorage.getItem(ITEM_KEY)).toBe('{"list":["Alice","Bob"]}');
  });

  it('applies a value another window stored during the restore, without its migrations', async () => {
    localStorage.setItem(ITEM_KEY, '{"list":[1]}');
    let finishMigration;
    const migration = vi.fn((value) => new Promise((resolve) => {
      finishMigration = () => resolve(value);
    }));
    const restoring = restore({ migrations: [migration] });
    await vi.waitFor(() => expect(migration).toHaveBeenCalled());

    storeInOtherWindow('{"list":[1,2]}');
    finishMigration();
    const state = await restoring;
    expect(state.value).toEqual({ list: [1, 2] });
    storeInOtherWindow('{"list":[1,2,3]}');

    expect(state.value).toEqual({ list: [1, 2, 3] });
    expect(migration).toHaveBeenCalledTimes(1);
  });

  it('keeps the migrated value it stored after a value of another window', async () => {
    localStorage.setItem(ITEM_KEY, '{"list":[1]}');
    let finishMigration;
    const restoring = restore({
      migrations: [() => new Promise((resolve) => {
        finishMigration = () => resolve({ list: [1], version: 2 });
      })],
    });
    await vi.waitFor(() => expect(finishMigration).toBeDefined());

    storeInOtherWindow('{"list":[1,2]}');
    finishMigration();
    const state = await restoring;

    expect(state.value).toEqual({ list: [1], version: 2 });
    expect(localStorage.getItem(ITEM_KEY)).toBe('{"list":[1],"version":2}');
  });

  it.each([
    ['of another key', ['{"list":[9]}', { key: 'sh-wallet_other' }]],
    ['of the session storage', ['{"list":[9]}', { storageArea: sessionStorage }]],
    ['of a removal', [null]],
    ['that is not JSON', ['{']],
    ['of null', ['null']],
  ])('ignores an event %s', async (_, args) => {
    const state = await restore();

    storeInOtherWindow(...args);

    expect(state.value).toEqual({ list: [] });
  });

  it.each([
    ['without the option', false, false],
    ['on mobile', true, true],
  ])('does not listen %s', async (_, syncWithOtherWindows, isMobile) => {
    vi.doMock('@/constants', async (importOriginal) => ({
      ...await importOriginal(),
      IS_MOBILE_APP: isMobile,
    }));
    const { useStorageRef } = await import('@/composables/storageRef');
    storageListeners.length = 0;

    await new Promise((resolve) => {
      useStorageRef({ list: [] }, 'key', { syncWithOtherWindows, onRestored: resolve });
    });

    expect(storageListeners).toEqual([]);
  });

  it('does not listen for a key of the vault, which syncs itself', async () => {
    const { STORAGE_KEYS } = await import('@/constants');
    const { useStorageRef } = await import('@/composables/storageRef');
    storageListeners.length = 0;

    await new Promise((resolve) => {
      useStorageRef('', STORAGE_KEYS.secureLoginTimeout, {
        syncWithOtherWindows: true,
        onRestored: resolve,
      });
    });

    expect(storageListeners).toEqual([]);
  });
});
