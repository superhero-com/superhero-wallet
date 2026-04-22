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
    get: jest.fn((key: string) => Promise.resolve(storeMock.get(key) ?? null)),
    set: jest.fn((key: string, value: any) => {
      storeMock.set(key, value);
      return Promise.resolve();
    }),
    remove: jest.fn((key: string) => {
      storeMock.delete(key);
      return Promise.resolve();
    }),
  };

  beforeEach(() => {
    jest.resetModules();
    storeMock.clear();
    walletStorageMock.get.mockClear();
    walletStorageMock.set.mockClear();
    walletStorageMock.remove.mockClear();

    jest.doMock('@/constants', () => ({
      IS_MOBILE_APP: false,
      STORAGE_KEYS: { defaultPasswordSecret: 'default-password-secret' },
    }));
    jest.doMock('@/lib/WalletStorage', () => ({ WalletStorage: walletStorageMock }));
    jest.doMock('@/lib/SecureMobileStorage', () => ({
      SecureMobileStorage: {
        get: jest.fn(), set: jest.fn(), remove: jest.fn(),
      },
    }));
    jest.doMock('@/utils/crypto', () => ({
      encodeBase64: (bytes: Uint8Array) => `b64(${bytes.length})`,
    }));
  });

  it('exposes the legacy hardcoded password as a migration fallback only', () => {
    // eslint-disable-next-line global-require
    const { LEGACY_DEFAULT_PASSWORD } = require('@/composables/defaultPassword');
    expect(LEGACY_DEFAULT_PASSWORD).toBe('testPassword123');
  });

  it('returns null when no secret has been stored', async () => {
    // eslint-disable-next-line global-require
    const { getDefaultPasswordSecret } = require('@/composables/defaultPassword');
    await expect(getDefaultPasswordSecret()).resolves.toBeNull();
    expect(walletStorageMock.get).toHaveBeenCalledWith('default-password-secret');
  });

  it('treats empty-string storage values as "no secret stored"', async () => {
    storeMock.set('default-password-secret', '');
    // eslint-disable-next-line global-require
    const { getDefaultPasswordSecret } = require('@/composables/defaultPassword');
    await expect(getDefaultPasswordSecret()).resolves.toBeNull();
  });

  it('getOrCreate generates a fresh 256-bit random secret and persists it on first call', async () => {
    // eslint-disable-next-line global-require
    const { getOrCreateDefaultPasswordSecret } = require('@/composables/defaultPassword');

    const secret = await getOrCreateDefaultPasswordSecret();

    // Random bytes are base64-encoded by the real `encodeBase64`; our stub
    // just records the byte count so we can assert the entropy size.
    expect(secret).toBe('b64(32)');
    expect(walletStorageMock.set).toHaveBeenCalledWith('default-password-secret', 'b64(32)');
    expect(walletStorageMock.set).toHaveBeenCalledTimes(1);
  });

  it('getOrCreate returns the persisted secret on subsequent calls without re-writing', async () => {
    storeMock.set('default-password-secret', 'existing-secret-value');
    // eslint-disable-next-line global-require
    const { getOrCreateDefaultPasswordSecret } = require('@/composables/defaultPassword');

    const secret = await getOrCreateDefaultPasswordSecret();

    expect(secret).toBe('existing-secret-value');
    expect(walletStorageMock.set).not.toHaveBeenCalled();
  });

  it('clearDefaultPasswordSecret removes the stored secret', async () => {
    storeMock.set('default-password-secret', 'some-value');
    // eslint-disable-next-line global-require
    const { clearDefaultPasswordSecret, getDefaultPasswordSecret } = require('@/composables/defaultPassword');

    await clearDefaultPasswordSecret();

    expect(walletStorageMock.remove).toHaveBeenCalledWith('default-password-secret');
    await expect(getDefaultPasswordSecret()).resolves.toBeNull();
  });
});
