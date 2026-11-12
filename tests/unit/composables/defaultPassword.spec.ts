// @ts-nocheck
/**
 * Unit tests for the per-install default-password secret helpers introduced
 * by CRIT-03 (replacing the hardcoded `STUB_ACCOUNT.password`). The storage
 * layer is mocked so the tests exercise only the branching logic and the
 * contract the callers rely on.
 */
describe('defaultPassword', () => {
  const storeMock = new Map<string, any>();
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

    vi.doMock('@/constants', () => ({
      IS_MOBILE_APP: false,
      STORAGE_KEYS: { defaultPasswordSecret: 'default-password-secret' },
    }));
    vi.doMock('@/lib/WalletStorage', () => ({ WalletStorage: walletStorageMock }));
    vi.doMock('@/lib/WalletVault', () => ({
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

  it('generates a 256-bit secret without storing it, which setPassword does with the salt', async () => {
    const { generateDefaultPasswordSecret } = await import('@/composables/defaultPassword');

    // Random bytes are base64-encoded by the real `encodeBase64`; our stub
    // just records the byte count so we can assert the entropy size.
    expect(generateDefaultPasswordSecret()).toBe('b64(32)');
    expect(walletStorageMock.set).not.toHaveBeenCalled();
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
  const refreshVaultMock = vi.fn();

  beforeEach(async () => {
    vi.resetModules();
    secureStoreMock.clear();
    secureMobileStorageMock.get.mockClear();
    secureMobileStorageMock.set.mockClear();
    secureMobileStorageMock.remove.mockClear();
    walletStorageMock.get.mockClear();
    walletStorageMock.set.mockClear();
    walletStorageMock.remove.mockClear();
    refreshVaultMock.mockClear();

    vi.doMock('@/constants', () => ({
      IS_MOBILE_APP: true,
      STORAGE_KEYS: { defaultPasswordSecret: 'default-password-secret' },
    }));
    vi.doMock('@/lib/WalletStorage', () => ({ WalletStorage: walletStorageMock }));
    vi.doMock('@/lib/WalletVault', () => ({
      ensureVaultReady: vi.fn().mockResolvedValue(undefined),
      refreshVault: refreshVaultMock,
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
    const { getDefaultPasswordSecret } = defaultPassword;

    await expect(getDefaultPasswordSecret()).resolves.toBeNull();

    expect(secureMobileStorageMock.get).toHaveBeenCalledWith('default-password-secret');
    expect(walletStorageMock.get).not.toHaveBeenCalled();
    expect(refreshVaultMock).not.toHaveBeenCalled();
  });
});

describe('defaultPassword over the vault shared with other windows', () => {
  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
    ['@/lib/WalletStorage', '@/lib/WalletVault', '@/lib/SecureMobileStorage', '@/utils/crypto']
      .forEach((path) => vi.doUnmock(path));
    vi.doMock('@/constants', async () => ({
      ...await vi.importActual('@/constants'),
      IS_MOBILE_APP: false,
    }));
  });

  it('returns the secret another window stored, without waiting for its notification', async () => {
    const { getDefaultPasswordSecret } = await import('@/composables/defaultPassword');
    const { STORAGE_KEYS } = await import('@/constants');
    expect(await getDefaultPasswordSecret()).toBeNull();

    vi.resetModules();
    const otherWindow = await import('@/lib/WalletVault');
    await otherWindow.writeVaultField(STORAGE_KEYS.defaultPasswordSecret, 'other-window-secret');

    expect(await getDefaultPasswordSecret()).toBe('other-window-secret');
  });
});
