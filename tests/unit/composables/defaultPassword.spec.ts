// @ts-nocheck
/**
 * Unit tests for the per-install default-password secret helpers introduced
 * by CRIT-03 (replacing the hardcoded `STUB_ACCOUNT.password`). The storage
 * layer is mocked so the tests exercise only the branching logic and the
 * contract the callers rely on.
 */
describe('defaultPassword', () => {
  const storeMock = new Map<string, any>();
  class VaultConflictError extends Error {}
  const readVaultMock = vi.fn(() => ({
    revision: 'test-revision',
    values: { 'default-password-secret': storeMock.get('default-password-secret') ?? null },
  }));
  const writeVaultFieldMock = vi.fn((key: string, value: string | null) => {
    if (value === null) storeMock.delete(key);
    else storeMock.set(key, value);
    return Promise.resolve();
  });
  const walletStorageMock = {
    get: vi.fn((key: string) => Promise.resolve(storeMock.get(key) ?? null)),
    set: vi.fn((key: string, value: any) => {
      storeMock.set(key, value);
      return Promise.resolve();
    }),
    remove: vi.fn((key: string) => {
      storeMock.delete(key);
      return Promise.resolve();
    }),
  };

  beforeEach(async () => {
    vi.resetModules();
    storeMock.clear();
    walletStorageMock.get.mockClear();
    walletStorageMock.set.mockClear();
    walletStorageMock.remove.mockClear();
    readVaultMock.mockClear();
    writeVaultFieldMock.mockClear();

    vi.doMock('@/constants', () => ({
      IS_MOBILE_APP: false,
      STORAGE_KEYS: { defaultPasswordSecret: 'default-password-secret' },
    }));
    vi.doMock('@/lib/WalletStorage', () => ({ WalletStorage: walletStorageMock }));
    vi.doMock('@/lib/WalletVault', () => ({
      readVault: readVaultMock,
      writeVaultField: writeVaultFieldMock,
      VaultConflictError,
      ensureVaultReady: vi.fn().mockResolvedValue(undefined),
      refreshVault: vi.fn().mockResolvedValue(undefined),
    }));
    vi.doMock('@/lib/SecureMobileStorage', () => ({
      SecureMobileStorage: {
        get: vi.fn(), set: vi.fn(), remove: vi.fn(),
      },
    }));
    vi.doMock('@/utils/crypto', () => ({
      encodeBase64: (bytes: Uint8Array) => `b64(${bytes.length})`,
    }));
  });

  it('exposes the legacy hardcoded password as a migration fallback only', async () => {
    // eslint-disable-next-line global-require
    const { LEGACY_DEFAULT_PASSWORD } = (await import('@/composables/defaultPassword'));
    expect(LEGACY_DEFAULT_PASSWORD).toBe('testPassword123');
  });

  it('returns null when no secret has been stored', async () => {
    // eslint-disable-next-line global-require
    const { getDefaultPasswordSecret } = (await import('@/composables/defaultPassword'));
    await expect(getDefaultPasswordSecret()).resolves.toBeNull();
    expect(walletStorageMock.get).toHaveBeenCalledWith('default-password-secret');
  });

  it('treats empty-string storage values as "no secret stored"', async () => {
    storeMock.set('default-password-secret', '');
    // eslint-disable-next-line global-require
    const { getDefaultPasswordSecret } = (await import('@/composables/defaultPassword'));
    await expect(getDefaultPasswordSecret()).resolves.toBeNull();
  });

  it('getOrCreate generates a fresh 256-bit random secret and persists it on first call', async () => {
    // eslint-disable-next-line global-require
    const { getOrCreateDefaultPasswordSecret } = (await import('@/composables/defaultPassword'));

    const secret = await getOrCreateDefaultPasswordSecret();

    // Random bytes are base64-encoded by the real `encodeBase64`; our stub
    // just records the byte count so we can assert the entropy size.
    expect(secret).toBe('b64(32)');
    expect(writeVaultFieldMock).toHaveBeenCalledWith('default-password-secret', 'b64(32)', {
      revision: 'test-revision', values: { 'default-password-secret': null },
    });
    expect(writeVaultFieldMock).toHaveBeenCalledTimes(1);
    expect(walletStorageMock.set).not.toHaveBeenCalled();
  });

  it('getOrCreate returns the persisted secret on subsequent calls without re-writing', async () => {
    storeMock.set('default-password-secret', 'existing-secret-value');
    // eslint-disable-next-line global-require
    const { getOrCreateDefaultPasswordSecret } = (await import('@/composables/defaultPassword'));

    const secret = await getOrCreateDefaultPasswordSecret();

    expect(secret).toBe('existing-secret-value');
    expect(writeVaultFieldMock).not.toHaveBeenCalled();
    expect(walletStorageMock.set).not.toHaveBeenCalled();
  });

  it('shares one in-flight creation between overlapping callers', async () => {
    const { getOrCreateDefaultPasswordSecret } = await import('@/composables/defaultPassword');

    await expect(Promise.all([
      getOrCreateDefaultPasswordSecret(), getOrCreateDefaultPasswordSecret(),
    ])).resolves.toEqual(['b64(32)', 'b64(32)']);

    expect(writeVaultFieldMock).toHaveBeenCalledTimes(1);
  });

  it('uses another window\'s committed secret after a conflicting creation', async () => {
    writeVaultFieldMock.mockImplementationOnce(() => {
      storeMock.set('default-password-secret', 'another-window-secret');
      return Promise.reject(new VaultConflictError());
    });
    const { getOrCreateDefaultPasswordSecret } = await import('@/composables/defaultPassword');

    await expect(getOrCreateDefaultPasswordSecret()).resolves.toBe('another-window-secret');

    expect(writeVaultFieldMock).toHaveBeenCalledTimes(1);
    expect(walletStorageMock.set).not.toHaveBeenCalled();
  });

  it('allows a later creation attempt after a failed vault write', async () => {
    writeVaultFieldMock.mockRejectedValueOnce(new Error('Storage unavailable'));
    const { getOrCreateDefaultPasswordSecret } = await import('@/composables/defaultPassword');

    await expect(getOrCreateDefaultPasswordSecret()).rejects.toThrow('Storage unavailable');
    await expect(getOrCreateDefaultPasswordSecret()).resolves.toBe('b64(32)');

    expect(writeVaultFieldMock).toHaveBeenCalledTimes(2);
  });
});

describe('defaultPassword on mobile', () => {
  const secureStoreMock = new Map<string, any>();
  const secureMobileStorageMock = {
    get: vi.fn((key: string) => Promise.resolve(secureStoreMock.get(key) ?? null)),
    set: vi.fn((key: string, value: any) => {
      secureStoreMock.set(key, value);
      return Promise.resolve();
    }),
    remove: vi.fn((key: string) => {
      secureStoreMock.delete(key);
      return Promise.resolve();
    }),
  };
  const walletStorageMock = {
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn(),
  };
  const readVaultMock = vi.fn();
  const writeVaultFieldMock = vi.fn();

  beforeEach(async () => {
    vi.resetModules();
    secureStoreMock.clear();
    secureMobileStorageMock.get.mockClear();
    secureMobileStorageMock.set.mockClear();
    secureMobileStorageMock.remove.mockClear();
    walletStorageMock.get.mockClear();
    walletStorageMock.set.mockClear();
    walletStorageMock.remove.mockClear();
    readVaultMock.mockClear();
    writeVaultFieldMock.mockClear();

    vi.doMock('@/constants', () => ({
      IS_MOBILE_APP: true,
      STORAGE_KEYS: { defaultPasswordSecret: 'default-password-secret' },
    }));
    vi.doMock('@/lib/WalletStorage', () => ({ WalletStorage: walletStorageMock }));
    vi.doMock('@/lib/WalletVault', () => ({
      readVault: readVaultMock,
      writeVaultField: writeVaultFieldMock,
      ensureVaultReady: vi.fn().mockResolvedValue(undefined),
      refreshVault: vi.fn().mockResolvedValue(undefined),
    }));
    vi.doMock('@/lib/SecureMobileStorage', () => ({
      SecureMobileStorage: secureMobileStorageMock,
    }));
    vi.doMock('@/utils/crypto', () => ({
      encodeBase64: (bytes: Uint8Array) => `b64(${bytes.length})`,
    }));
  });

  it('uses SecureMobileStorage instead of WalletStorage', async () => {
    // eslint-disable-next-line global-require
    const defaultPassword = (await import('@/composables/defaultPassword'));
    const { getDefaultPasswordSecret, getOrCreateDefaultPasswordSecret } = defaultPassword;

    await expect(getDefaultPasswordSecret()).resolves.toBeNull();
    const secret = await getOrCreateDefaultPasswordSecret();

    expect(secret).toBe('b64(32)');
    expect(secureMobileStorageMock.get).toHaveBeenCalledWith('default-password-secret');
    expect(secureMobileStorageMock.set).toHaveBeenCalledWith('default-password-secret', 'b64(32)');
    expect(walletStorageMock.get).not.toHaveBeenCalled();
    expect(walletStorageMock.set).not.toHaveBeenCalled();
    expect(readVaultMock).not.toHaveBeenCalled();
    expect(writeVaultFieldMock).not.toHaveBeenCalled();
  });
});
