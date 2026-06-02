// @ts-nocheck
import { ref, nextTick } from 'vue';

describe('useAuth mobile biometric login', () => {
  beforeEach(async () => {
    vi.resetModules();
  });

  it('keeps the wallet locked when the biometric login prompt is dismissed', async () => {
    const mnemonicRef = ref('encrypted-mnemonic');
    const encryptionSaltRef = ref(null);
    const secureLoginTimeoutRef = ref(null);
    const openBiometricLoginModal = vi.fn().mockRejectedValue(new Error('dismissed'));

    vi.doMock('@aparajita/capacitor-biometric-auth', () => ({
      BiometricAuth: {
        checkBiometry: vi.fn().mockResolvedValue({ isAvailable: true }),
      },
    }));
    vi.doMock('@/constants', () => ({
      AUTHENTICATION_TIMEOUTS: [1000, 5000, 10000],
      IS_EXTENSION: false,
      IS_IOS: false,
      IS_MOBILE_APP: true,
      IS_OFFSCREEN_TAB: false,
      RUNNING_IN_TESTS: false,
      STORAGE_KEYS: {
        mnemonic: 'mnemonic',
        encryptionSalt: 'encryption-salt',
        secureLoginTimeout: 'secure-login-timeout',
      },
    }));
    vi.doMock('@/popup/plugins/i18n', () => ({ tg: (key: string) => key }));
    vi.doMock('@/lib/logger', () => ({
      __esModule: true,
      default: { write: vi.fn() },
    }));
    vi.doMock('@/migrations/002-mnemonic-vuex-to-composable', () => ({ __esModule: true, default: vi.fn() }));
    vi.doMock('@/migrations/008-mnemonic-cordova-to-ionic', () => ({ __esModule: true, default: vi.fn() }));
    vi.doMock('@/migrations/010-mnemonic-mobile-to-secure-storage', () => ({ __esModule: true, default: vi.fn() }));
    vi.doMock('@/migrations/011-mobile-sensitive-data-encryption', () => ({ __esModule: true, default: vi.fn() }));
    vi.doMock('@/composables/defaultPassword', () => ({
      LEGACY_DEFAULT_PASSWORD: 'testPassword123',
      clearDefaultPasswordSecret: vi.fn(),
      getDefaultPasswordSecret: vi.fn().mockResolvedValue(null),
      getOrCreateDefaultPasswordSecret: vi.fn().mockResolvedValue('secret'),
    }));
    vi.doMock('@/composables/ui', () => ({
      useUi: () => ({
        isBiometricLoginEnabled: ref(true),
        isAppActive: ref(true),
        setBiometricLoginEnabled: vi.fn(),
        setLoaderVisible: vi.fn(),
      }),
    }));
    vi.doMock('@/composables/modals', () => ({
      useModals: () => ({
        openBiometricLoginModal,
        openPasswordLoginModal: vi.fn(),
        openEnableBiometricLoginModal: vi.fn(),
      }),
    }));
    vi.doMock('@/composables/storageRef', () => ({
      useStorageRef: (_initialState, key, options = {}) => {
        const byKey = {
          mnemonic: mnemonicRef,
          'encryption-salt': encryptionSaltRef,
          'secure-login-timeout': secureLoginTimeoutRef,
        };
        options.onRestored?.(byKey[key]?.value ?? null);
        return byKey[key] ?? ref(_initialState);
      },
    }));
    vi.doMock('@/utils', () => ({
      createCustomScopedComposable: (factory) => {
        let value;
        return () => {
          if (!value) value = factory();
          return value;
        };
      },
      decodeBase64: vi.fn(),
      decrypt: vi.fn().mockResolvedValue('abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'),
      decryptedComputed: vi.fn(() => ref('1000')),
      encodeBase64: vi.fn(),
      encrypt: vi.fn(),
      excludeFalsy: Boolean,
      generateEncryptionKey: vi.fn(),
      generateSalt: vi.fn(),
      getOrCreateMobileEncryptionKey: vi.fn().mockResolvedValue({}),
      getSessionEncryptionKey: vi.fn().mockResolvedValue(null),
      handleUnknownError: vi.fn(),
      sessionEnd: vi.fn(),
      sessionStart: vi.fn(),
      watchUntilTruthy: vi.fn(async (source) => (typeof source === 'function' ? source() : source.value)),
    }));

    let auth;
    vi.resetModules();
      // eslint-disable-next-line global-require
      auth = (await import('@/composables/auth')).useAuth();

    await auth.checkUserAuth();
    await nextTick();

    expect(openBiometricLoginModal).toHaveBeenCalledTimes(1);
    expect(auth.isAuthenticated.value).toBe(false);
  });

  it('unblocks concurrent auth checks when biometric login is dismissed', async () => {
    const mnemonicRef = ref('encrypted-mnemonic');
    const encryptionSaltRef = ref(null);
    const secureLoginTimeoutRef = ref(null);
    let rejectBiometricLogin: (error: Error) => void;
    const openBiometricLoginModal = vi.fn(() => new Promise((_resolve, reject) => {
      rejectBiometricLogin = reject;
    }));
    const waitFor = (predicate: () => boolean): Promise<void> => (
      predicate()
        ? Promise.resolve()
        : new Promise((resolve) => { setTimeout(resolve, 0); })
          .then(() => waitFor(predicate))
    );

    vi.doMock('@aparajita/capacitor-biometric-auth', () => ({
      BiometricAuth: {
        checkBiometry: vi.fn().mockResolvedValue({ isAvailable: true }),
      },
    }));
    vi.doMock('@/constants', () => ({
      AUTHENTICATION_TIMEOUTS: [1000, 5000, 10000],
      IS_EXTENSION: false,
      IS_IOS: false,
      IS_MOBILE_APP: true,
      IS_OFFSCREEN_TAB: false,
      RUNNING_IN_TESTS: false,
      STORAGE_KEYS: {
        mnemonic: 'mnemonic',
        encryptionSalt: 'encryption-salt',
        secureLoginTimeout: 'secure-login-timeout',
      },
    }));
    vi.doMock('@/popup/plugins/i18n', () => ({ tg: (key: string) => key }));
    vi.doMock('@/lib/logger', () => ({
      __esModule: true,
      default: { write: vi.fn() },
    }));
    vi.doMock('@/migrations/002-mnemonic-vuex-to-composable', () => ({ __esModule: true, default: vi.fn() }));
    vi.doMock('@/migrations/008-mnemonic-cordova-to-ionic', () => ({ __esModule: true, default: vi.fn() }));
    vi.doMock('@/migrations/010-mnemonic-mobile-to-secure-storage', () => ({ __esModule: true, default: vi.fn() }));
    vi.doMock('@/migrations/011-mobile-sensitive-data-encryption', () => ({ __esModule: true, default: vi.fn() }));
    vi.doMock('@/composables/defaultPassword', () => ({
      LEGACY_DEFAULT_PASSWORD: 'testPassword123',
      clearDefaultPasswordSecret: vi.fn(),
      getDefaultPasswordSecret: vi.fn().mockResolvedValue(null),
      getOrCreateDefaultPasswordSecret: vi.fn().mockResolvedValue('secret'),
    }));
    vi.doMock('@/composables/ui', () => ({
      useUi: () => ({
        isBiometricLoginEnabled: ref(true),
        isAppActive: ref(true),
        setBiometricLoginEnabled: vi.fn(),
        setLoaderVisible: vi.fn(),
      }),
    }));
    vi.doMock('@/composables/modals', () => ({
      useModals: () => ({
        openBiometricLoginModal,
        openPasswordLoginModal: vi.fn(),
        openEnableBiometricLoginModal: vi.fn(),
      }),
    }));
    vi.doMock('@/composables/storageRef', () => ({
      useStorageRef: (_initialState, key, options = {}) => {
        const byKey = {
          mnemonic: mnemonicRef,
          'encryption-salt': encryptionSaltRef,
          'secure-login-timeout': secureLoginTimeoutRef,
        };
        options.onRestored?.(byKey[key]?.value ?? null);
        return byKey[key] ?? ref(_initialState);
      },
    }));
    vi.doMock('@/utils', () => ({
      createCustomScopedComposable: (factory) => {
        let value;
        return () => {
          if (!value) value = factory();
          return value;
        };
      },
      decodeBase64: vi.fn(),
      decrypt: vi.fn().mockResolvedValue('abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'),
      decryptedComputed: vi.fn(() => ref('1000')),
      encodeBase64: vi.fn(),
      encrypt: vi.fn(),
      excludeFalsy: Boolean,
      generateEncryptionKey: vi.fn(),
      generateSalt: vi.fn(),
      getOrCreateMobileEncryptionKey: vi.fn().mockResolvedValue({}),
      getSessionEncryptionKey: vi.fn().mockResolvedValue(null),
      handleUnknownError: vi.fn(),
      sessionEnd: vi.fn(),
      sessionStart: vi.fn(),
      watchUntilTruthy: vi.fn(async (source) => {
        const getValue = () => (typeof source === 'function' ? source() : source.value);
        await waitFor(() => !!getValue());
        return getValue();
      }),
    }));

    let auth;
    vi.resetModules();
      // eslint-disable-next-line global-require
      auth = (await import('@/composables/auth')).useAuth();

    const firstAuthCheck = auth.checkUserAuth();
    await waitFor(() => openBiometricLoginModal.mock.calls.length > 0);
    const secondAuthCheck = auth.checkUserAuth();
    await Promise.resolve();

    rejectBiometricLogin!(new Error('dismissed'));

    await expect(firstAuthCheck).resolves.toBeUndefined();
    await expect(secondAuthCheck).resolves.toBeUndefined();
    expect(openBiometricLoginModal).toHaveBeenCalledTimes(1);
    expect(auth.isAuthenticated.value).toBe(false);
  });

  it('forces biometric verification even when biometric login is disabled', async () => {
    const mnemonicRef = ref('encrypted-mnemonic');
    const encryptionSaltRef = ref(null);
    const secureLoginTimeoutRef = ref(null);
    const isBiometricLoginEnabled = ref(false);
    const authenticate = vi.fn().mockResolvedValue(undefined);
    const openBiometricLoginModal = vi.fn().mockResolvedValue(undefined);

    vi.doMock('@aparajita/capacitor-biometric-auth', () => ({
      BiometricAuth: {
        authenticate,
        checkBiometry: vi.fn().mockResolvedValue({ isAvailable: true }),
      },
    }));
    vi.doMock('@/constants', () => ({
      AUTHENTICATION_TIMEOUTS: [1000, 5000, 10000],
      IS_EXTENSION: false,
      IS_IOS: false,
      IS_MOBILE_APP: true,
      IS_OFFSCREEN_TAB: false,
      RUNNING_IN_TESTS: false,
      STORAGE_KEYS: {
        mnemonic: 'mnemonic',
        encryptionSalt: 'encryption-salt',
        secureLoginTimeout: 'secure-login-timeout',
      },
    }));
    vi.doMock('@/popup/plugins/i18n', () => ({ tg: (key: string) => key }));
    vi.doMock('@/lib/logger', () => ({
      __esModule: true,
      default: { write: vi.fn() },
    }));
    vi.doMock('@/migrations/002-mnemonic-vuex-to-composable', () => ({ __esModule: true, default: vi.fn() }));
    vi.doMock('@/migrations/008-mnemonic-cordova-to-ionic', () => ({ __esModule: true, default: vi.fn() }));
    vi.doMock('@/migrations/010-mnemonic-mobile-to-secure-storage', () => ({ __esModule: true, default: vi.fn() }));
    vi.doMock('@/migrations/011-mobile-sensitive-data-encryption', () => ({ __esModule: true, default: vi.fn() }));
    vi.doMock('@/composables/defaultPassword', () => ({
      LEGACY_DEFAULT_PASSWORD: 'testPassword123',
      clearDefaultPasswordSecret: vi.fn(),
      getDefaultPasswordSecret: vi.fn().mockResolvedValue(null),
      getOrCreateDefaultPasswordSecret: vi.fn().mockResolvedValue('secret'),
    }));
    vi.doMock('@/composables/ui', () => ({
      useUi: () => ({
        isBiometricLoginEnabled,
        isAppActive: ref(true),
        setBiometricLoginEnabled: vi.fn(),
        setLoaderVisible: vi.fn(),
      }),
    }));
    vi.doMock('@/composables/modals', () => ({
      useModals: () => ({
        openBiometricLoginModal,
        openPasswordLoginModal: vi.fn(),
        openEnableBiometricLoginModal: vi.fn(),
      }),
    }));
    vi.doMock('@/composables/storageRef', () => ({
      useStorageRef: (_initialState, key, options = {}) => {
        const byKey = {
          mnemonic: mnemonicRef,
          'encryption-salt': encryptionSaltRef,
          'secure-login-timeout': secureLoginTimeoutRef,
        };
        options.onRestored?.(byKey[key]?.value ?? null);
        return byKey[key] ?? ref(_initialState);
      },
    }));
    vi.doMock('@/utils', () => ({
      createCustomScopedComposable: (factory) => {
        let value;
        return () => {
          if (!value) value = factory();
          return value;
        };
      },
      decodeBase64: vi.fn(),
      decrypt: vi.fn().mockResolvedValue('abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'),
      decryptedComputed: vi.fn(() => ref('1000')),
      encodeBase64: vi.fn(),
      encrypt: vi.fn(),
      excludeFalsy: Boolean,
      generateEncryptionKey: vi.fn(),
      generateSalt: vi.fn(),
      getOrCreateMobileEncryptionKey: vi.fn().mockResolvedValue({}),
      getSessionEncryptionKey: vi.fn().mockResolvedValue(null),
      handleUnknownError: vi.fn(),
      sessionEnd: vi.fn(),
      sessionStart: vi.fn(),
      watchUntilTruthy: vi.fn(async (source) => (typeof source === 'function' ? source() : source.value)),
    }));

    let auth;
    vi.resetModules();
      // eslint-disable-next-line global-require
      auth = (await import('@/composables/auth')).useAuth();

    await auth.checkUserAuth();
    expect(auth.isAuthenticated.value).toBe(true);

    await auth.lockWallet();
    expect(openBiometricLoginModal).toHaveBeenCalledWith({
      force: true,
      deferAuthStateUpdate: true,
    });
    expect(auth.isAuthenticated.value).toBe(true);

    await auth.logout();
    expect(auth.isAuthenticated.value).toBe(false);

    await auth.authenticateWithBiometry(true);

    expect(authenticate).toHaveBeenCalledTimes(1);
    expect(auth.isAuthenticated.value).toBe(true);
  });

  it('does not auto-lock on mobile app resume when biometric login is disabled', async () => {
    const mnemonicRef = ref('encrypted-mnemonic');
    const encryptionSaltRef = ref(null);
    const secureLoginTimeoutRef = ref(null);
    const isBiometricLoginEnabled = ref(false);
    const isAppActive = ref(true);
    const openBiometricLoginModal = vi.fn().mockResolvedValue(undefined);

    vi.doMock('@aparajita/capacitor-biometric-auth', () => ({
      BiometricAuth: {
        checkBiometry: vi.fn().mockResolvedValue({ isAvailable: true }),
      },
    }));
    vi.doMock('@/constants', () => ({
      AUTHENTICATION_TIMEOUTS: [1000, 5000, 10000],
      IS_EXTENSION: false,
      IS_IOS: false,
      IS_MOBILE_APP: true,
      IS_OFFSCREEN_TAB: false,
      RUNNING_IN_TESTS: false,
      STORAGE_KEYS: {
        mnemonic: 'mnemonic',
        encryptionSalt: 'encryption-salt',
        secureLoginTimeout: 'secure-login-timeout',
      },
    }));
    vi.doMock('@/popup/plugins/i18n', () => ({ tg: (key: string) => key }));
    vi.doMock('@/lib/logger', () => ({
      __esModule: true,
      default: { write: vi.fn() },
    }));
    vi.doMock('@/migrations/002-mnemonic-vuex-to-composable', () => ({ __esModule: true, default: vi.fn() }));
    vi.doMock('@/migrations/008-mnemonic-cordova-to-ionic', () => ({ __esModule: true, default: vi.fn() }));
    vi.doMock('@/migrations/010-mnemonic-mobile-to-secure-storage', () => ({ __esModule: true, default: vi.fn() }));
    vi.doMock('@/migrations/011-mobile-sensitive-data-encryption', () => ({ __esModule: true, default: vi.fn() }));
    vi.doMock('@/composables/defaultPassword', () => ({
      LEGACY_DEFAULT_PASSWORD: 'testPassword123',
      clearDefaultPasswordSecret: vi.fn(),
      getDefaultPasswordSecret: vi.fn().mockResolvedValue(null),
      getOrCreateDefaultPasswordSecret: vi.fn().mockResolvedValue('secret'),
    }));
    vi.doMock('@/composables/ui', () => ({
      useUi: () => ({
        isBiometricLoginEnabled,
        isAppActive,
        setBiometricLoginEnabled: vi.fn(),
        setLoaderVisible: vi.fn(),
      }),
    }));
    vi.doMock('@/composables/modals', () => ({
      useModals: () => ({
        openBiometricLoginModal,
        openPasswordLoginModal: vi.fn(),
        openEnableBiometricLoginModal: vi.fn(),
      }),
    }));
    vi.doMock('@/composables/storageRef', () => ({
      useStorageRef: (_initialState, key, options = {}) => {
        const byKey = {
          mnemonic: mnemonicRef,
          'encryption-salt': encryptionSaltRef,
          'secure-login-timeout': secureLoginTimeoutRef,
        };
        options.onRestored?.(byKey[key]?.value ?? null);
        return byKey[key] ?? ref(_initialState);
      },
    }));
    vi.doMock('@/utils', () => ({
      createCustomScopedComposable: (factory) => {
        let value;
        return () => {
          if (!value) value = factory();
          return value;
        };
      },
      decodeBase64: vi.fn(),
      decrypt: vi.fn().mockResolvedValue('abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'),
      decryptedComputed: vi.fn(() => ref('1000')),
      encodeBase64: vi.fn(),
      encrypt: vi.fn(),
      excludeFalsy: Boolean,
      generateEncryptionKey: vi.fn(),
      generateSalt: vi.fn(),
      getOrCreateMobileEncryptionKey: vi.fn().mockResolvedValue({}),
      getSessionEncryptionKey: vi.fn().mockResolvedValue(null),
      handleUnknownError: vi.fn(),
      sessionEnd: vi.fn(),
      sessionStart: vi.fn(),
      watchUntilTruthy: vi.fn(async (source) => (typeof source === 'function' ? source() : source.value)),
    }));

    vi.useFakeTimers();
    try {
      let auth;
      vi.resetModules();
        // eslint-disable-next-line global-require
        auth = (await import('@/composables/auth')).useAuth();

      await auth.checkUserAuth();
      expect(auth.isAuthenticated.value).toBe(true);

      isAppActive.value = false;
      await nextTick();
      vi.advanceTimersByTime(1000);
      isAppActive.value = true;
      await nextTick();
      await Promise.resolve();

      expect(openBiometricLoginModal).not.toHaveBeenCalled();
      expect(auth.isAuthenticated.value).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it('keeps mnemonic encryption on the mobile data key when setPassword is called', async () => {
    const mnemonicRef = ref('encrypted-mnemonic');
    const encryptionSaltRef = ref(null);
    const secureLoginTimeoutRef = ref(null);
    const mobileKey = { type: 'mobile-key' };
    const generateEncryptionKey = vi.fn();
    const generateSalt = vi.fn();
    const encrypt = vi.fn().mockResolvedValue('mobile-ciphertext');

    vi.doMock('@aparajita/capacitor-biometric-auth', () => ({
      BiometricAuth: {
        checkBiometry: vi.fn().mockResolvedValue({ isAvailable: false }),
      },
    }));
    vi.doMock('@/constants', () => ({
      AUTHENTICATION_TIMEOUTS: [1000, 5000, 10000],
      IS_EXTENSION: false,
      IS_IOS: false,
      IS_MOBILE_APP: true,
      IS_OFFSCREEN_TAB: false,
      RUNNING_IN_TESTS: false,
      STORAGE_KEYS: {
        mnemonic: 'mnemonic',
        encryptionSalt: 'encryption-salt',
        secureLoginTimeout: 'secure-login-timeout',
      },
    }));
    vi.doMock('@/popup/plugins/i18n', () => ({ tg: (key: string) => key }));
    vi.doMock('@/lib/logger', () => ({
      __esModule: true,
      default: { write: vi.fn() },
    }));
    vi.doMock('@/migrations/002-mnemonic-vuex-to-composable', () => ({ __esModule: true, default: vi.fn() }));
    vi.doMock('@/migrations/008-mnemonic-cordova-to-ionic', () => ({ __esModule: true, default: vi.fn() }));
    vi.doMock('@/migrations/010-mnemonic-mobile-to-secure-storage', () => ({ __esModule: true, default: vi.fn() }));
    vi.doMock('@/migrations/011-mobile-sensitive-data-encryption', () => ({ __esModule: true, default: vi.fn() }));
    vi.doMock('@/composables/defaultPassword', () => ({
      LEGACY_DEFAULT_PASSWORD: 'testPassword123',
      clearDefaultPasswordSecret: vi.fn(),
      getDefaultPasswordSecret: vi.fn().mockResolvedValue(null),
      getOrCreateDefaultPasswordSecret: vi.fn().mockResolvedValue('secret'),
    }));
    vi.doMock('@/composables/ui', () => ({
      useUi: () => ({
        isBiometricLoginEnabled: ref(false),
        isAppActive: ref(true),
        setBiometricLoginEnabled: vi.fn(),
        setLoaderVisible: vi.fn(),
      }),
    }));
    vi.doMock('@/composables/modals', () => ({
      useModals: () => ({
        openBiometricLoginModal: vi.fn(),
        openPasswordLoginModal: vi.fn(),
        openEnableBiometricLoginModal: vi.fn(),
      }),
    }));
    vi.doMock('@/composables/storageRef', () => ({
      useStorageRef: (_initialState, key, options = {}) => {
        const byKey = {
          mnemonic: mnemonicRef,
          'encryption-salt': encryptionSaltRef,
          'secure-login-timeout': secureLoginTimeoutRef,
        };
        options.onRestored?.(byKey[key]?.value ?? null);
        return byKey[key] ?? ref(_initialState);
      },
    }));
    vi.doMock('@/utils', () => ({
      createCustomScopedComposable: (factory) => {
        let value;
        return () => {
          if (!value) value = factory();
          return value;
        };
      },
      decodeBase64: vi.fn(),
      decrypt: vi.fn().mockResolvedValue('abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'),
      decryptedComputed: vi.fn(() => ref('1000')),
      encodeBase64: vi.fn(),
      encrypt,
      excludeFalsy: Boolean,
      generateEncryptionKey,
      generateSalt,
      getOrCreateMobileEncryptionKey: vi.fn().mockResolvedValue(mobileKey),
      getSessionEncryptionKey: vi.fn().mockResolvedValue(null),
      handleUnknownError: vi.fn(),
      sessionEnd: vi.fn(),
      sessionStart: vi.fn(),
      watchUntilTruthy: vi.fn(async (source) => (typeof source === 'function' ? source() : source.value)),
    }));

    let auth;
    vi.resetModules();
      // eslint-disable-next-line global-require
      auth = (await import('@/composables/auth')).useAuth();

    await Promise.resolve();
    await auth.setPassword('user-password', 'plain mobile mnemonic');

    expect(generateSalt).not.toHaveBeenCalled();
    expect(generateEncryptionKey).not.toHaveBeenCalled();
    expect(encrypt).toHaveBeenCalledWith(mobileKey, 'plain mobile mnemonic');
    expect(mnemonicRef.value).toBe('mobile-ciphertext');
  });
});
