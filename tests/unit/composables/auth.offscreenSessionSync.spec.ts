// @ts-nocheck
/**
 * Regression test for the offscreen session-key sync behaviour.
 *
 * `syncBackgroundEncryptionKey` polls for `CHECK_FOR_SESSION_KEY_TIMEOUT`
 * (30 s) and then unconditionally stops. The salt watcher that drives it
 * only fires when `encryptionSalt` changes — once per password setup. So
 * if the popup user takes longer than 30 s to enter their password, the
 * offscreen tab would never recover the session key and `encryptionKey`
 * would stay unset (breaking Ledger / WalletConnect / EVM RPC handlers).
 *
 * The fix wires `browser.storage.session.onChanged` as a second wake-up
 * source via `subscribeToSessionEncryptionKey`. This test asserts that
 * subscription is registered when running in the offscreen context and
 * that triggering the listener restarts the sync.
 */
import { ref } from 'vue';

describe('useAuth offscreen session-key wake-up', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('subscribes to session-key updates and restarts the sync on storage change', async () => {
    const subscribeToSessionEncryptionKey = jest.fn();
    const getSessionEncryptionKey = jest.fn().mockResolvedValue(null);

    const mnemonicRef = ref('encrypted-mnemonic-blob');
    const encryptionSaltRef = ref(null);
    const secureLoginTimeoutRef = ref(null);

    jest.doMock('@aparajita/capacitor-biometric-auth', () => ({
      BiometricAuth: {
        checkBiometry: jest.fn().mockResolvedValue({ isAvailable: false }),
      },
    }));
    jest.doMock('@/constants', () => ({
      AUTHENTICATION_TIMEOUTS: [1000, 5000, 10000],
      IS_EXTENSION: false,
      IS_IOS: false,
      IS_MOBILE_APP: false,
      IS_OFFSCREEN_TAB: true,
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
        isBiometricLoginEnabled: ref(false),
        isAppActive: ref(true),
        setBiometricLoginEnabled: jest.fn(),
        setLoaderVisible: jest.fn(),
      }),
    }));
    jest.doMock('@/composables/modals', () => ({
      useModals: () => ({
        openBiometricLoginModal: jest.fn(),
        openPasswordLoginModal: jest.fn(),
        openEnableBiometricLoginModal: jest.fn(),
      }),
    }));
    jest.doMock('@/composables/storageRef', () => ({
      useStorageRef: (_initialState: any, key: string, options: any = {}) => {
        const byKey: Record<string, any> = {
          mnemonic: mnemonicRef,
          'encryption-salt': encryptionSaltRef,
          'secure-login-timeout': secureLoginTimeoutRef,
        };
        options.onRestored?.(byKey[key]?.value ?? null);
        return byKey[key] ?? ref(_initialState);
      },
    }));
    jest.doMock('@/utils', () => ({
      createCustomScopedComposable: (factory: any) => {
        let value: any;
        return () => {
          if (!value) value = factory();
          return value;
        };
      },
      decodeBase64: jest.fn(),
      decrypt: jest.fn().mockResolvedValue('decrypted'),
      decryptedComputed: jest.fn(() => ref('1000')),
      encodeBase64: jest.fn(),
      encrypt: jest.fn(),
      excludeFalsy: Boolean,
      generateEncryptionKey: jest.fn(),
      generateSalt: jest.fn(),
      getOrCreateMobileEncryptionKey: jest.fn(),
      getSessionEncryptionKey,
      handleUnknownError: jest.fn(),
      sessionEnd: jest.fn(),
      sessionStart: jest.fn(),
      subscribeToSessionEncryptionKey,
      watchUntilTruthy: jest.fn(async (source: any) => (
        typeof source === 'function' ? source() : source.value
      )),
    }));

    jest.useFakeTimers();
    try {
      jest.isolateModules(() => {
        // eslint-disable-next-line global-require
        require('@/composables/auth').useAuth();
      });

      // Wire-up assertion: the offscreen branch must register the listener
      // alongside the salt watcher.
      expect(subscribeToSessionEncryptionKey).toHaveBeenCalledTimes(1);
      const onSessionKey = subscribeToSessionEncryptionKey.mock.calls[0][0];
      expect(typeof onSessionKey).toBe('function');

      // The callback must restart the sync — i.e. begin polling
      // `getSessionEncryptionKey` again — even after the original
      // salt-driven poll has already given up.
      onSessionKey();
      jest.advanceTimersByTime(5000);
      await Promise.resolve();
      await Promise.resolve();
      expect(getSessionEncryptionKey).toHaveBeenCalled();
    } finally {
      jest.useRealTimers();
    }
  });

  it('does not subscribe when not running in the offscreen tab', async () => {
    const subscribeToSessionEncryptionKey = jest.fn();

    const mnemonicRef = ref('');
    const encryptionSaltRef = ref(null);
    const secureLoginTimeoutRef = ref(null);

    jest.doMock('@aparajita/capacitor-biometric-auth', () => ({
      BiometricAuth: {
        checkBiometry: jest.fn().mockResolvedValue({ isAvailable: false }),
      },
    }));
    jest.doMock('@/constants', () => ({
      AUTHENTICATION_TIMEOUTS: [1000, 5000, 10000],
      IS_EXTENSION: false,
      IS_IOS: false,
      IS_MOBILE_APP: false,
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
        isBiometricLoginEnabled: ref(false),
        isAppActive: ref(true),
        setBiometricLoginEnabled: jest.fn(),
        setLoaderVisible: jest.fn(),
      }),
    }));
    jest.doMock('@/composables/modals', () => ({
      useModals: () => ({
        openBiometricLoginModal: jest.fn(),
        openPasswordLoginModal: jest.fn(),
        openEnableBiometricLoginModal: jest.fn(),
      }),
    }));
    jest.doMock('@/composables/storageRef', () => ({
      useStorageRef: (_initialState: any, key: string, options: any = {}) => {
        const byKey: Record<string, any> = {
          mnemonic: mnemonicRef,
          'encryption-salt': encryptionSaltRef,
          'secure-login-timeout': secureLoginTimeoutRef,
        };
        options.onRestored?.(byKey[key]?.value ?? null);
        return byKey[key] ?? ref(_initialState);
      },
    }));
    jest.doMock('@/utils', () => ({
      createCustomScopedComposable: (factory: any) => {
        let value: any;
        return () => {
          if (!value) value = factory();
          return value;
        };
      },
      decodeBase64: jest.fn(),
      decrypt: jest.fn(),
      decryptedComputed: jest.fn(() => ref('1000')),
      encodeBase64: jest.fn(),
      encrypt: jest.fn(),
      excludeFalsy: Boolean,
      generateEncryptionKey: jest.fn(),
      generateSalt: jest.fn(),
      getOrCreateMobileEncryptionKey: jest.fn(),
      getSessionEncryptionKey: jest.fn().mockResolvedValue(null),
      handleUnknownError: jest.fn(),
      sessionEnd: jest.fn(),
      sessionStart: jest.fn(),
      subscribeToSessionEncryptionKey,
      watchUntilTruthy: jest.fn(async (source: any) => (
        typeof source === 'function' ? source() : source.value
      )),
    }));

    jest.isolateModules(() => {
      // eslint-disable-next-line global-require
      require('@/composables/auth').useAuth();
    });

    expect(subscribeToSessionEncryptionKey).not.toHaveBeenCalled();
  });
});

describe('subscribeToSessionEncryptionKey helper', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('only invokes the callback for session-area writes with a truthy newValue', async () => {
    const addListener = jest.fn();
    const removeListener = jest.fn();
    (global as any).browser = {
      storage: {
        onChanged: { addListener, removeListener },
      },
    };

    jest.doMock('@/constants', () => ({
      CONNECTION_TYPES: { SESSION: 'session' },
      IS_EXTENSION: false,
      IS_OFFSCREEN_TAB: true,
    }));
    jest.doMock('@/offscreen/popupHandler', () => ({
      getSessionEncryptionKey: jest.fn(),
    }));

    let subscribeToSessionEncryptionKey: any;
    jest.isolateModules(() => {
      // eslint-disable-next-line global-require
      subscribeToSessionEncryptionKey = require('@/utils/session').subscribeToSessionEncryptionKey;
    });

    const callback = jest.fn();
    const teardown = subscribeToSessionEncryptionKey(callback);

    expect(addListener).toHaveBeenCalledTimes(1);
    const listener = addListener.mock.calls[0][0];

    // Wrong area: ignored
    listener({ exportedEncryptionKey: { newValue: 'k' } }, 'local');
    expect(callback).not.toHaveBeenCalled();

    // Right area, but session-end (newValue undefined): ignored
    listener({ exportedEncryptionKey: { oldValue: 'k' } }, 'session');
    expect(callback).not.toHaveBeenCalled();

    // Right area, unrelated key: ignored
    listener({ otherKey: { newValue: 'x' } }, 'session');
    expect(callback).not.toHaveBeenCalled();

    // Right area, right key, truthy newValue: invoked
    listener({ exportedEncryptionKey: { newValue: 'k' } }, 'session');
    expect(callback).toHaveBeenCalledTimes(1);

    teardown();
    expect(removeListener).toHaveBeenCalledWith(listener);
  });

  it('returns a no-op when storage.onChanged is unavailable', () => {
    (global as any).browser = { storage: {} };

    jest.doMock('@/constants', () => ({
      CONNECTION_TYPES: { SESSION: 'session' },
      IS_EXTENSION: false,
      IS_OFFSCREEN_TAB: true,
    }));
    jest.doMock('@/offscreen/popupHandler', () => ({
      getSessionEncryptionKey: jest.fn(),
    }));

    let subscribeToSessionEncryptionKey: any;
    jest.isolateModules(() => {
      // eslint-disable-next-line global-require
      subscribeToSessionEncryptionKey = require('@/utils/session').subscribeToSessionEncryptionKey;
    });

    const teardown = subscribeToSessionEncryptionKey(jest.fn());
    expect(typeof teardown).toBe('function');
    expect(() => teardown()).not.toThrow();
  });
});
