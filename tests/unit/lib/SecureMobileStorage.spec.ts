// @ts-nocheck
describe('SecureMobileStorage insert-only creation on iOS', () => {
  let SecureMobileStorage;
  let SecureStorage;
  let KeychainAccess;
  let nativeGetOrCreate;

  beforeEach(async () => {
    vi.resetModules();
    nativeGetOrCreate = vi.fn();
    vi.doMock('@aparajita/capacitor-secure-storage', async (importOriginal) => {
      const actual = await importOriginal();
      return {
        ...actual,
        SecureStorage: {
          setDefaultKeychainAccess: vi.fn(),
          getKeyPrefix: vi.fn().mockResolvedValue('capacitor-storage_'),
          getSynchronize: vi.fn().mockResolvedValue(false),
          internalGetOrCreateItem: nativeGetOrCreate,
          setItem: vi.fn(),
        },
      };
    });
    const { Capacitor } = await import('@capacitor/core');
    vi.spyOn(Capacitor, 'getPlatform').mockReturnValue('ios');
    ({ SecureStorage, KeychainAccess } = await import('@aparajita/capacitor-secure-storage'));
    ({ SecureMobileStorage } = await import('@/lib/SecureMobileStorage'));
  });

  afterEach(() => vi.restoreAllMocks());

  it('returns the stored value from the native operation instead of the proposed replacement', async () => {
    nativeGetOrCreate.mockResolvedValue({ data: JSON.stringify('original-key') });

    await expect(SecureMobileStorage.getOrCreate('mobile-data-key', 'replacement-key'))
      .resolves.toBe('original-key');

    expect(nativeGetOrCreate).toHaveBeenCalledWith({
      prefixedKey: 'capacitor-storage_sh-wallet_mobile-data-key',
      data: JSON.stringify('replacement-key'),
      sync: false,
      access: KeychainAccess.whenUnlocked,
    });
    expect(SecureStorage.setItem).not.toHaveBeenCalled();
  });

  it('propagates native errors without falling back to an overwriting write', async () => {
    const readError = new Error('Existing key is temporarily inaccessible');
    nativeGetOrCreate.mockRejectedValue(readError);

    await expect(SecureMobileStorage.getOrCreate('mobile-data-key', 'replacement-key'))
      .rejects.toBe(readError);

    expect(SecureStorage.setItem).not.toHaveBeenCalled();
  });
});
