import {
  afterEach, beforeEach, describe, expect, it, vi,
} from 'vitest';
import type { EffectScope } from 'vue';

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => { resolve = done; });
  return { promise, resolve };
}

describe('decryptedComputed mobile updates', () => {
  let crypto: typeof import('@/utils/crypto');
  let common: typeof import('@/utils/common');
  let vue: typeof import('vue');
  const scopes: EffectScope[] = [];

  beforeEach(async () => {
    vi.resetModules();
    vi.doMock('@/constants', async (importOriginal) => ({
      ...await importOriginal<typeof import('@/constants')>(),
      IS_MOBILE_APP: true,
      IS_EXTENSION: false,
      IS_OFFSCREEN_TAB: false,
    }));
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    crypto = await import('@/utils/crypto');
    common = await import('@/utils/common');
    vue = await import('vue');
  });

  afterEach(() => {
    scopes.splice(0).forEach((scope) => scope.stop());
    vi.restoreAllMocks();
  });

  async function createState(plaintext: string | null = '["existing"]') {
    const keyBytes = globalThis.crypto.getRandomValues(new Uint8Array(32));
    const dataKey = await crypto.importEncryptionKey(keyBytes);
    const key = vue.ref<CryptoKey | undefined>(dataKey);
    const encrypted = vue.ref(plaintext === null ? null : await crypto.encrypt(dataKey, plaintext));
    const scope = vue.effectScope();
    scopes.push(scope);
    const onDecrypted = vi.fn();
    const onDecryptFailed = vi.fn();
    const value = scope.run(() => common.decryptedComputed(key, encrypted, '[]', {
      onDecrypted, onDecryptFailed,
    }))!;
    await vi.waitFor(() => expect(value.value).toBe(plaintext ?? '[]'));
    return {
      key, dataKey, encrypted, value, scope, onDecrypted, onDecryptFailed,
    };
  }

  // Delay one real crypto operation, without replacing its ciphertext or plaintext.
  function pauseOperation(
    method: 'encrypt' | 'decrypt',
    shouldPause: (bytes: BufferSource) => boolean = () => true,
  ) {
    const entered = deferred();
    const release = deferred();
    const finished = deferred();
    const realOperation = globalThis.crypto.subtle[method].bind(globalThis.crypto.subtle);
    let paused = false;
    vi.spyOn(globalThis.crypto.subtle, method).mockImplementation(async (...args) => {
      if (paused || !shouldPause(args[2])) return realOperation(...args);
      paused = true;
      entered.resolve();
      try {
        await release.promise;
        return await realOperation(...args);
      } finally {
        finished.resolve();
      }
    });
    return { entered: entered.promise, release: release.resolve, finished: finished.promise };
  }

  const append = (item: string) => (plaintext: string) => JSON.stringify([
    ...JSON.parse(plaintext), item,
  ]);

  it('includes the preceding update while its watcher is still decrypting', async () => {
    const state = await createState();
    const sourceBytes = crypto.decodeBase64(state.encrypted.value!).slice(crypto.IV_LENGTH).toString('hex');
    // Hold readback of the first published change, regardless of whether the
    // updater also decrypts its source before writing that change.
    const readback = pauseOperation('decrypt', (bytes) => Buffer.from(bytes as Uint8Array).toString('hex') !== sourceBytes);
    try {
      await state.value.update(append('first'));
      await readback.entered;
      expect(state.value.value).toBe('["existing"]');

      await state.value.update(append('second'));

      expect(JSON.parse(await crypto.decrypt(state.dataKey, state.encrypted.value!)))
        .toEqual(['existing', 'first', 'second']);
      await vi.waitFor(() => expect(state.value.value).toBe('["existing","first","second"]'));
    } finally {
      readback.release();
      await readback.finished;
      // The held crypto operation finished; let its awaiting watcher settle too.
      await new Promise<void>((resolve) => { setTimeout(resolve, 0); });
    }
    expect(state.value.value).toBe('["existing","first","second"]');
    expect(state.onDecrypted).toHaveBeenLastCalledWith('["existing","first","second"]');
  });

  it('uses the default only when no ciphertext is stored', async () => {
    const state = await createState(null);
    await state.value.update(append('first'));
    expect(JSON.parse(await crypto.decrypt(state.dataKey, state.encrypted.value!))).toEqual(['first']);
    await vi.waitFor(() => expect(state.value.value).toBe('["first"]'));
  });

  it('preserves unreadable ciphertext instead of replacing it with a transformed default', async () => {
    const state = await createState();
    state.encrypted.value = 'unreadable-ciphertext';
    const transform = vi.fn(append('first'));

    await expect(state.value.update(transform)).rejects.toThrow();

    expect(transform).not.toHaveBeenCalled();
    expect(state.encrypted.value).toBe('unreadable-ciphertext');
    await vi.waitFor(() => expect(state.onDecryptFailed).toHaveBeenCalledOnce());
  });

  it('rejects an update started while locked without changing ciphertext', async () => {
    const state = await createState();
    const previous = state.encrypted.value;
    state.key.value = undefined;

    await expect(state.value.update(append('first'))).rejects.toThrow('locked');

    expect(state.encrypted.value).toBe(previous);
  });

  it.each(['decrypt', 'encrypt'] as const)('preserves ciphertext when %s fails', async (method) => {
    const state = await createState();
    const previous = state.encrypted.value;
    vi.spyOn(globalThis.crypto.subtle, method).mockRejectedValueOnce(new Error('crypto unavailable'));

    await expect(state.value.update(append('first'))).rejects.toThrow('crypto unavailable');

    expect(state.encrypted.value).toBe(previous);
  });

  it.each([
    ['decrypt', 'ciphertext'], ['encrypt', 'ciphertext'],
    ['decrypt', 'key'], ['encrypt', 'key'],
    ['decrypt', 'reset'], ['encrypt', 'reset'],
  ] as const)('rejects a %s interrupted by a %s change', async (method, changed) => {
    const state = await createState();
    // Isolate the update's conflict checks from the separate key-rotation watcher.
    state.scope.stop();
    const previous = state.encrypted.value;
    const external = await crypto.encrypt(state.dataKey, '["external"]');
    const replacementBytes = globalThis.crypto.getRandomValues(new Uint8Array(32));
    const replacementKey = await crypto.importEncryptionKey(replacementBytes);
    const operation = pauseOperation(method);
    const updating = state.value.update(append('first'));
    const rejected = expect(updating).rejects.toThrow('wallet changed');
    try {
      await operation.entered;
      if (changed === 'ciphertext') state.encrypted.value = external;
      else if (changed === 'key') state.key.value = replacementKey;
      else state.encrypted.value = null;
    } finally {
      operation.release();
    }
    await rejected;

    if (changed === 'ciphertext') expect(state.encrypted.value).toBe(external);
    else if (changed === 'key') expect(state.encrypted.value).toBe(previous);
    else expect(state.encrypted.value).toBeNull();
  });

  it.each(['decrypt', 'encrypt'] as const)('finishes a %s interrupted by a simple lock with the captured key', async (method) => {
    const state = await createState();
    const operation = pauseOperation(method);
    const updating = state.value.update(append('first'));
    try {
      await operation.entered;
      state.key.value = undefined;
      await vue.nextTick();
    } finally {
      operation.release();
    }
    await updating;

    expect(state.key.value).toBeUndefined();
    expect(JSON.parse(await crypto.decrypt(state.dataKey, state.encrypted.value!)))
      .toEqual(['existing', 'first']);
  });

  it('rejects a competing import without overwriting the successful import', async () => {
    const state = await createState();
    const firstEncryption = pauseOperation('encrypt');
    const firstImport = state.value.update(append('first-account'));
    const rejected = expect(firstImport).rejects.toThrow('wallet changed');
    try {
      await firstEncryption.entered;
      await state.value.update(append('second-account'));
    } finally {
      firstEncryption.release();
    }
    await rejected;

    expect(JSON.parse(await crypto.decrypt(state.dataKey, state.encrypted.value!)))
      .toEqual(['existing', 'second-account']);
    await vi.waitFor(() => expect(state.value.value).toBe('["existing","second-account"]'));
  });
});

describe('decryptedComputed over the native mobile storage', () => {
  const nativeValues = new Map<string, string>();
  const setItem = vi.fn();
  const scopes: EffectScope[] = [];

  beforeEach(() => {
    vi.resetModules();
    nativeValues.clear();
    setItem.mockReset().mockImplementation(async (key: string, value: string) => {
      nativeValues.set(key, value);
    });
    vi.doMock('@/constants', async (importOriginal) => ({
      ...await importOriginal<typeof import('@/constants')>(),
      IS_MOBILE_APP: true,
      IS_EXTENSION: false,
      IS_OFFSCREEN_TAB: false,
    }));
    // Only the native plugin is replaced; SecureMobileStorage and the storage ref are real.
    vi.doMock('@aparajita/capacitor-secure-storage', () => ({
      KeychainAccess: { whenUnlocked: 1 },
      SecureStorage: {
        setDefaultKeychainAccess: vi.fn(),
        getItem: async (key: string) => nativeValues.get(key) ?? null,
        setItem: (key: string, value: string) => setItem(key, value),
      },
    }));
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    scopes.splice(0).forEach((scope) => scope.stop());
    vi.restoreAllMocks();
  });

  async function createState() {
    const crypto = await import('@/utils/crypto');
    const common = await import('@/utils/common');
    const vue = await import('vue');
    const { useStorageRef } = await import('@/composables/storageRef');
    const { STORAGE_KEYS } = await import('@/constants');
    const dataKey = await crypto.importEncryptionKey(
      globalThis.crypto.getRandomValues(new Uint8Array(32)),
    );
    const key = vue.ref<CryptoKey | undefined>(dataKey);
    const scope = vue.effectScope();
    scopes.push(scope);
    let encrypted!: ReturnType<typeof vue.ref<string | null>>;
    await new Promise((resolve) => {
      encrypted = scope.run(() => useStorageRef<string | null>(
        null,
        STORAGE_KEYS.preclaimedNames,
        { enableSecureStorage: true, onRestored: resolve },
      ))!;
    });
    const value = scope.run(() => common.decryptedComputed(key, encrypted, '{}'))!;
    const stored = async () => {
      const raw = [...nativeValues.values()].at(-1);
      return raw ? crypto.decrypt(dataKey, JSON.parse(raw)) : null;
    };
    return { value, stored };
  }

  it('resolves an update only once the native storage saved it', async () => {
    const { value, stored } = await createState();
    let finishWrite!: () => void;
    setItem.mockImplementationOnce((key: string, data: string) => new Promise<void>((resolve) => {
      finishWrite = () => { nativeValues.set(key, data); resolve(); };
    }));
    let isSettled = false;
    const updating = value.update(() => '{"name":1}').then(() => { isSettled = true; });

    await vi.waitFor(() => expect(finishWrite).toBeDefined());
    expect(isSettled).toBe(false);
    finishWrite();
    await updating;
    expect(await stored()).toBe('{"name":1}');
    await vi.waitFor(() => expect(value.value).toBe('{"name":1}'));
  });

  it('rejects an update the native storage failed to save', async () => {
    const { value } = await createState();
    setItem.mockRejectedValueOnce(new Error('Keychain write failed'));

    await expect(value.update(() => '{"name":1}')).rejects.toThrow('Keychain write failed');
  });
});
