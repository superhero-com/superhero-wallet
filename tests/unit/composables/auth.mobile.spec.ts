// @ts-nocheck
import { ref, nextTick } from 'vue';

describe('useAuth mobile biometric login', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('keeps the wallet locked when the biometric login prompt is dismissed', async () => {
    const mnemonicRef = ref('encrypted-mnemonic');
    const encryptionSaltRef = ref(null);
    const secureLoginTimeoutRef = ref(null);
    const openBiometricLoginModal = jest.fn().mockRejectedValue(new Error('dismissed'));

    jest.doMock('@aparajita/capacitor-biometric-auth', () => ({
      BiometricAuth: {
        checkBiometry: jest.fn().mockResolvedValue({ isAvailable: true }),
      },
    }));
    jest.doMock('@/constants', () => ({
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
    jest.doMock('@/popup/plugins/i18n', () => ({ tg: (key: string) => key }));
    jest.doMock('@/lib/logger', () => ({
      __esModule: true,
      default: { write: jest.fn() },
    }));
    jest.doMock('@/migrations/002-mnemonic-vuex-to-composable', () => ({ __esModule: true, default: jest.fn() }));
    jest.doMock('@/migrations/008-mnemonic-cordova-to-ionic', () => ({ __esModule: true, default: jest.fn() }));
    jest.doMock('@/migrations/010-mnemonic-mobile-to-secure-storage', () => ({ __esModule: true, default: jest.fn() }));
    jest.doMock('@/migrations/011-mobile-sensitive-data-encryption', () => ({ __esModule: true, default: jest.fn() }));
    jest.doMock('@/composables/defaultPassword', () => ({
      LEGACY_DEFAULT_PASSWORD: 'testPassword123',
      clearDefaultPasswordSecret: jest.fn(),
      getDefaultPasswordSecret: jest.fn().mockResolvedValue(null),
      getOrCreateDefaultPasswordSecret: jest.fn().mockResolvedValue('secret'),
    }));
    jest.doMock('@/composables/ui', () => ({
      useUi: () => ({
        isBiometricLoginEnabled: ref(true),
        isAppActive: ref(true),
        setBiometricLoginEnabled: jest.fn(),
        setLoaderVisible: jest.fn(),
      }),
    }));
    jest.doMock('@/composables/modals', () => ({
      useModals: () => ({
        openBiometricLoginModal,
        openPasswordLoginModal: jest.fn(),
        openEnableBiometricLoginModal: jest.fn(),
      }),
    }));
    jest.doMock('@/composables/storageRef', () => ({
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
    jest.doMock('@/utils', () => ({
      createCustomScopedComposable: (factory) => {
        let value;
        return () => {
          if (!value) value = factory();
          return value;
        };
      },
      decodeBase64: jest.fn(),
      decrypt: jest.fn().mockResolvedValue('abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'),
      decryptedComputed: jest.fn(() => ref('1000')),
      encodeBase64: jest.fn(),
      encrypt: jest.fn(),
      excludeFalsy: Boolean,
      generateEncryptionKey: jest.fn(),
      generateSalt: jest.fn(),
      getOrCreateMobileEncryptionKey: jest.fn().mockResolvedValue({}),
      getSessionEncryptionKey: jest.fn().mockResolvedValue(null),
      handleUnknownError: jest.fn(),
      sessionEnd: jest.fn(),
      sessionStart: jest.fn(),
      watchUntilTruthy: jest.fn(async (source) => (typeof source === 'function' ? source() : source.value)),
    }));

    let auth;
    jest.isolateModules(() => {
      // eslint-disable-next-line global-require
      auth = require('@/composables/auth').useAuth();
    });

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
    const openBiometricLoginModal = jest.fn(() => new Promise((_resolve, reject) => {
      rejectBiometricLogin = reject;
    }));
    const waitFor = (predicate: () => boolean): Promise<void> => (
      predicate()
        ? Promise.resolve()
        : new Promise((resolve) => { setTimeout(resolve, 0); })
          .then(() => waitFor(predicate))
    );

    jest.doMock('@aparajita/capacitor-biometric-auth', () => ({
      BiometricAuth: {
        checkBiometry: jest.fn().mockResolvedValue({ isAvailable: true }),
      },
    }));
    jest.doMock('@/constants', () => ({
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
    jest.doMock('@/popup/plugins/i18n', () => ({ tg: (key: string) => key }));
    jest.doMock('@/lib/logger', () => ({
      __esModule: true,
      default: { write: jest.fn() },
    }));
    jest.doMock('@/migrations/002-mnemonic-vuex-to-composable', () => ({ __esModule: true, default: jest.fn() }));
    jest.doMock('@/migrations/008-mnemonic-cordova-to-ionic', () => ({ __esModule: true, default: jest.fn() }));
    jest.doMock('@/migrations/010-mnemonic-mobile-to-secure-storage', () => ({ __esModule: true, default: jest.fn() }));
    jest.doMock('@/migrations/011-mobile-sensitive-data-encryption', () => ({ __esModule: true, default: jest.fn() }));
    jest.doMock('@/composables/defaultPassword', () => ({
      LEGACY_DEFAULT_PASSWORD: 'testPassword123',
      clearDefaultPasswordSecret: jest.fn(),
      getDefaultPasswordSecret: jest.fn().mockResolvedValue(null),
      getOrCreateDefaultPasswordSecret: jest.fn().mockResolvedValue('secret'),
    }));
    jest.doMock('@/composables/ui', () => ({
      useUi: () => ({
        isBiometricLoginEnabled: ref(true),
        isAppActive: ref(true),
        setBiometricLoginEnabled: jest.fn(),
        setLoaderVisible: jest.fn(),
      }),
    }));
    jest.doMock('@/composables/modals', () => ({
      useModals: () => ({
        openBiometricLoginModal,
        openPasswordLoginModal: jest.fn(),
        openEnableBiometricLoginModal: jest.fn(),
      }),
    }));
    jest.doMock('@/composables/storageRef', () => ({
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
    jest.doMock('@/utils', () => ({
      createCustomScopedComposable: (factory) => {
        let value;
        return () => {
          if (!value) value = factory();
          return value;
        };
      },
      decodeBase64: jest.fn(),
      decrypt: jest.fn().mockResolvedValue('abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'),
      decryptedComputed: jest.fn(() => ref('1000')),
      encodeBase64: jest.fn(),
      encrypt: jest.fn(),
      excludeFalsy: Boolean,
      generateEncryptionKey: jest.fn(),
      generateSalt: jest.fn(),
      getOrCreateMobileEncryptionKey: jest.fn().mockResolvedValue({}),
      getSessionEncryptionKey: jest.fn().mockResolvedValue(null),
      handleUnknownError: jest.fn(),
      sessionEnd: jest.fn(),
      sessionStart: jest.fn(),
      watchUntilTruthy: jest.fn(async (source) => {
        const getValue = () => (typeof source === 'function' ? source() : source.value);
        await waitFor(() => !!getValue());
        return getValue();
      }),
    }));

    let auth;
    jest.isolateModules(() => {
      // eslint-disable-next-line global-require
      auth = require('@/composables/auth').useAuth();
    });

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
});
