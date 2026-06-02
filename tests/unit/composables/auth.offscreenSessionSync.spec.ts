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
  beforeEach(async () => {
    vi.resetModules();
  });

  it('subscribes to session-key updates and restarts the sync on storage change', async () => {
    const subscribeToSessionEncryptionKey = vi.fn();
    const getSessionEncryptionKey = vi.fn().mockResolvedValue(null);

    const mnemonicRef = ref('encrypted-mnemonic-blob');
    const encryptionSaltRef = ref(null);
    const secureLoginTimeoutRef = ref(null);

    vi.doMock('@aparajita/capacitor-biometric-auth', () => ({
      BiometricAuth: {
        checkBiometry: vi.fn().mockResolvedValue({ isAvailable: false }),
      },
    }));
    vi.doMock('@/constants', () => ({
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
    vi.doMock('@/utils', () => ({
      createCustomScopedComposable: (factory: any) => {
        let value: any;
        return () => {
          if (!value) value = factory();
          return value;
        };
      },
      decodeBase64: vi.fn(),
      decrypt: vi.fn().mockResolvedValue('decrypted'),
      decryptedComputed: vi.fn(() => ref('1000')),
      encodeBase64: vi.fn(),
      encrypt: vi.fn(),
      excludeFalsy: Boolean,
      generateEncryptionKey: vi.fn(),
      generateSalt: vi.fn(),
      getOrCreateMobileEncryptionKey: vi.fn(),
      getSessionEncryptionKey,
      handleUnknownError: vi.fn(),
      sessionEnd: vi.fn(),
      sessionStart: vi.fn(),
      subscribeToSessionEncryptionKey,
      watchUntilTruthy: vi.fn(async (source: any) => (
        typeof source === 'function' ? source() : source.value
      )),
    }));

    vi.useFakeTimers();
    try {
      vi.resetModules();
        // eslint-disable-next-line global-require
        (await import('@/composables/auth')).useAuth();

      // Wire-up assertion: the offscreen branch must register the listener
      // alongside the salt watcher.
      expect(subscribeToSessionEncryptionKey).toHaveBeenCalledTimes(1);
      const onSessionKey = subscribeToSessionEncryptionKey.mock.calls[0][0];
      expect(typeof onSessionKey).toBe('function');

      // The callback must restart the sync — i.e. begin polling
      // `getSessionEncryptionKey` again — even after the original
      // salt-driven poll has already given up.
      onSessionKey();
      vi.advanceTimersByTime(5000);
      await Promise.resolve();
      await Promise.resolve();
      expect(getSessionEncryptionKey).toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it('does not subscribe when not running in the offscreen tab', async () => {
    const subscribeToSessionEncryptionKey = vi.fn();

    const mnemonicRef = ref('');
    const encryptionSaltRef = ref(null);
    const secureLoginTimeoutRef = ref(null);

    vi.doMock('@aparajita/capacitor-biometric-auth', () => ({
      BiometricAuth: {
        checkBiometry: vi.fn().mockResolvedValue({ isAvailable: false }),
      },
    }));
    vi.doMock('@/constants', () => ({
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
    vi.doMock('@/utils', () => ({
      createCustomScopedComposable: (factory: any) => {
        let value: any;
        return () => {
          if (!value) value = factory();
          return value;
        };
      },
      decodeBase64: vi.fn(),
      decrypt: vi.fn(),
      decryptedComputed: vi.fn(() => ref('1000')),
      encodeBase64: vi.fn(),
      encrypt: vi.fn(),
      excludeFalsy: Boolean,
      generateEncryptionKey: vi.fn(),
      generateSalt: vi.fn(),
      getOrCreateMobileEncryptionKey: vi.fn(),
      getSessionEncryptionKey: vi.fn().mockResolvedValue(null),
      handleUnknownError: vi.fn(),
      sessionEnd: vi.fn(),
      sessionStart: vi.fn(),
      subscribeToSessionEncryptionKey,
      watchUntilTruthy: vi.fn(async (source: any) => (
        typeof source === 'function' ? source() : source.value
      )),
    }));

    vi.resetModules();
      // eslint-disable-next-line global-require
      (await import('@/composables/auth')).useAuth();

    expect(subscribeToSessionEncryptionKey).not.toHaveBeenCalled();
  });
});

describe('subscribeToSessionEncryptionKey helper', () => {
  beforeEach(async () => {
    vi.resetModules();
  });

  it('only invokes the callback for session-area writes with a truthy newValue', async () => {
    const addListener = vi.fn();
    const removeListener = vi.fn();
    (global as any).browser = {
      storage: {
        onChanged: { addListener, removeListener },
      },
    };

    vi.doMock('@/constants', () => ({
      CONNECTION_TYPES: { SESSION: 'session' },
      IS_EXTENSION: false,
      IS_OFFSCREEN_TAB: true,
    }));
    vi.doMock('@/offscreen/popupHandler', () => ({
      getSessionEncryptionKey: vi.fn(),
    }));

    let subscribeToSessionEncryptionKey: any;
    vi.resetModules();
      // eslint-disable-next-line global-require
      subscribeToSessionEncryptionKey = (await import('@/utils/session')).subscribeToSessionEncryptionKey;

    const callback = vi.fn();
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

  it('returns a no-op when storage.onChanged is unavailable', async () => {
    (global as any).browser = { storage: {} };

    vi.doMock('@/constants', () => ({
      CONNECTION_TYPES: { SESSION: 'session' },
      IS_EXTENSION: false,
      IS_OFFSCREEN_TAB: true,
    }));
    vi.doMock('@/offscreen/popupHandler', () => ({
      getSessionEncryptionKey: vi.fn(),
    }));

    let subscribeToSessionEncryptionKey: any;
    vi.resetModules();
      // eslint-disable-next-line global-require
      subscribeToSessionEncryptionKey = (await import('@/utils/session')).subscribeToSessionEncryptionKey;

    const teardown = subscribeToSessionEncryptionKey(vi.fn());
    expect(typeof teardown).toBe('function');
    expect(() => teardown()).not.toThrow();
  });
});
