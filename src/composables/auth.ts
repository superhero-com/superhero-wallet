import { BiometricAuth } from '@aparajita/capacitor-biometric-auth';
import {
  computed,
  reactive,
  readonly,
  ref,
  watch,
} from 'vue';
import { generateMnemonic, mnemonicToSeedSync, validateMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';

import { tg as t } from '@/popup/plugins/i18n';
import {
  AUTHENTICATION_TIMEOUTS,
  IS_EXTENSION,
  IS_IOS,
  IS_MOBILE_APP,
  IS_OFFSCREEN_TAB,
  RUNNING_IN_TESTS,
  STORAGE_KEYS,
} from '@/constants';
import { STUB_ACCOUNT } from '@/constants/stubs';
import {
  createCustomScopedComposable,
  decodeBase64,
  decrypt,
  decryptedComputed,
  encodeBase64,
  encrypt,
  excludeFalsy,
  generateEncryptionKey,
  generateSalt,
  getSessionEncryptionKey,
  sessionEnd,
  sessionStart,
  watchUntilTruthy,
} from '@/utils';

import migrateMnemonicVuexToComposable from '@/migrations/002-mnemonic-vuex-to-composable';
import migrateMnemonicCordovaToIonic from '@/migrations/008-mnemonic-cordova-to-ionic';
import migrateMnemonicMobileToSecureStorage from '@/migrations/010-mnemonic-mobile-to-secure-storage';

import { useUi } from './ui';
import { useModals } from './modals';
import { useStorageRef } from './storageRef';

const CHECK_FOR_SESSION_KEY_INTERVAL = 5000;
const AUTHENTICATION_TIMEOUT_DEFAULT = (IS_MOBILE_APP)
  ? AUTHENTICATION_TIMEOUTS[0]
  : AUTHENTICATION_TIMEOUTS[2];

/**
 * Top level composable that controls if user is allowed to interact with the wallet.
 * It uses two different ways of authentication:
 *   1. Biometric (fingerprint scanner/face recognition) for mobile devices (Ionic).
 *   2. Password protection (encrypting the mnemonic) for web and extension.
 */
export const useAuth = createCustomScopedComposable(() => {
  const {
    isBiometricLoginEnabled,
    isAppActive,
    setBiometricLoginEnabled,
    setLoaderVisible,
  } = useUi();
  const {
    openBiometricLoginModal,
    openPasswordLoginModal,
    openEnableBiometricLoginModal,
  } = useModals();

  let isSessionExpired = false;
  let expirationTimeout: NodeJS.Timeout;

  /** Common state for both biometric or password protection */
  const isAuthenticated = ref(false);
  const isAuthenticating = ref(false);
  const isMnemonicRestored = ref(false);
  /** User skipped setting password so the test one was used */
  const isUsingDefaultPassword = ref(false);
  const encryptionKey = ref<CryptoKey>();

  /**
   * Depending on environment and app version this value
   * can be both encrypted (web & extension since v2.3) or decrypted (mobile).
   */
  const mnemonic = useStorageRef<string>(
    '',
    STORAGE_KEYS.mnemonic,
    {
      backgroundSync: true,
      enableSecureStorage: true,
      migrations: [
        (IS_MOBILE_APP && IS_IOS) ? migrateMnemonicCordovaToIonic : null,
        migrateMnemonicVuexToComposable,
        (IS_MOBILE_APP) ? migrateMnemonicMobileToSecureStorage : null,
      ].filter(excludeFalsy),
      onRestored() {
        isMnemonicRestored.value = true;
      },
    },
  );

  /** Part of the `encryptionKey` that is used to encrypt/decrypt protected data */
  const encryptionSalt = useStorageRef<Uint8Array | null>(
    null,
    STORAGE_KEYS.encryptionSalt,
    {
      backgroundSync: true,
      enableSecureStorage: true,
      serializer: {
        write: (val) => encodeBase64(val!),
        read: (val) => val ? decodeBase64(val as any) : null,
      },
    },
  );

  const secureLoginTimeout = useStorageRef<string | null>(
    null,
    STORAGE_KEYS.secureLoginTimeout,
    {
      backgroundSync: true,
      enableSecureStorage: true,
    },
  );

  const secureLoginTimeoutDecrypted = decryptedComputed(
    encryptionKey,
    secureLoginTimeout,
    AUTHENTICATION_TIMEOUT_DEFAULT,
  );

  /** If mnemonic is invalid, it is most likely encrypted */
  const isMnemonicEncrypted = computed(
    () => !IS_MOBILE_APP && mnemonic.value && !validateMnemonic(mnemonic.value, wordlist),
  );
  const mnemonicEncrypted = computed(() => isMnemonicEncrypted.value ? mnemonic.value : null);
  const mnemonicDecrypted = ref('');

  const mnemonicSeed = computed(
    () => mnemonicDecrypted.value === '' ? null : mnemonicToSeedSync(mnemonicDecrypted.value),
  );

  const biometricAuth = reactive({
    available: false,
    updating: false,
    checked: false,
  });

  /**
   * Checks if biometric authentication is available on the device.
   */
  async function checkBiometricLoginAvailability({ forceUpdate = false } = {}) {
    if (!IS_MOBILE_APP) {
      return false;
    }
    if (biometricAuth.updating) {
      await watchUntilTruthy(() => !biometricAuth.updating);
    } else if (!biometricAuth.checked || forceUpdate) {
      biometricAuth.updating = true;
      biometricAuth.available = (await BiometricAuth.checkBiometry()).isAvailable;
      biometricAuth.checked = true;
      biometricAuth.updating = false;
    }
    if (!biometricAuth.available && isBiometricLoginEnabled.value) {
      setBiometricLoginEnabled(false);
    }
    return biometricAuth.available;
  }

  /**
   * Setting/Resetting the password key logs the user in/out.
   */
  function setEncryptionKey(newEncryptionKey?: CryptoKey) {
    encryptionKey.value = newEncryptionKey;
    if (IS_EXTENSION) {
      if (newEncryptionKey) {
        sessionStart(newEncryptionKey);
      } else {
        sessionEnd();
      }
    }
  }

  async function getEncryptionKey() {
    const key = await watchUntilTruthy(encryptionKey);
    return key;
  }

  async function setPassword(password: string) {
    encryptionSalt.value = generateSalt();
    const newEncryptionKey = await generateEncryptionKey(password, encryptionSalt.value);
    setEncryptionKey(newEncryptionKey);
    mnemonic.value = await encrypt(newEncryptionKey, mnemonicDecrypted.value);
    isAuthenticated.value = true;
  }

  async function setMnemonicAndInitializeAuthentication(newMnemonic: string, isRestored = false) {
    if (IS_MOBILE_APP) {
      mnemonic.value = newMnemonic;
      if (await checkBiometricLoginAvailability()) {
        await openEnableBiometricLoginModal();
      }
    } else {
      const { openSetPasswordModal } = useModals();
      const password = await openSetPasswordModal(isRestored).catch(() => {
        throw new Error('Password was not set.');
      });
      await setPassword(password);
      mnemonic.value = await encrypt(encryptionKey.value!, newMnemonic);
    }

    mnemonicDecrypted.value = newMnemonic;
  }

  /**
   * Try to obtain the encryption key from extension's background process.
   */
  async function syncBackgroundEncryptionKey() {
    await new Promise<void>((resolve) => {
      const interval = setInterval(async () => {
        const sessionEncryptionKey = await getSessionEncryptionKey();
        if (sessionEncryptionKey) {
          mnemonicDecrypted.value = await decrypt(sessionEncryptionKey, mnemonicEncrypted.value!);
          setEncryptionKey(sessionEncryptionKey);
          clearInterval(interval);
          resolve();
        }
      }, CHECK_FOR_SESSION_KEY_INTERVAL);
    });
  }

  async function authenticateWithPassword(password: string): Promise<boolean> {
    if (!isAuthenticated.value && isMnemonicEncrypted.value) {
      const key = await generateEncryptionKey(password, encryptionSalt.value!);
      const decryptionResult = await decrypt(key, mnemonicEncrypted.value!);
      setEncryptionKey(key);

      if (!decryptionResult) {
        return false;
      }

      mnemonicDecrypted.value = decryptionResult;
      isAuthenticated.value = true;
    }
    return true;
  }

  async function authenticateWithBiometry(force = false): Promise<boolean> {
    if (
      (
        !isAuthenticated.value
        || force
      )
      && isBiometricLoginEnabled.value
      && await checkBiometricLoginAvailability()
    ) {
      return BiometricAuth.authenticate({
        reason: t('biometricAuth.reason'),
        cancelTitle: t('common.cancel'),
        allowDeviceCredential: true,
        iosFallbackTitle: t('biometricAuth.fallbackTitle'),
        androidTitle: t('biometricAuth.title'),
        androidSubtitle: t('biometricAuth.subtitle'),
        androidConfirmationRequired: false,
      }).then(() => {
        isAuthenticated.value = true;
        return true;
      });
    }
    return true;
  }

  /**
   * Open biometric login or password login modal depending on the environment settings.
   * The modals then uses one of the `authenticateWithPassword`
   * or `authenticateWithBiometry` methods.
   */
  async function checkUserAuth(): Promise<any> {
    await watchUntilTruthy(isMnemonicRestored);

    if (!mnemonic.value || isAuthenticated.value) {
      return;
    }
    if (isAuthenticating.value) {
      await watchUntilTruthy(isAuthenticated);
      return;
    }

    isUsingDefaultPassword.value = false;
    isAuthenticating.value = true;

    if (IS_MOBILE_APP) {
      if (isBiometricLoginEnabled.value && await checkBiometricLoginAvailability()) {
        await openBiometricLoginModal();
      } else {
        isAuthenticated.value = true;
      }
    } else if (isMnemonicEncrypted.value) {
      // Environments that will always ask user about password
      const autoLoginDisabledEnv = IS_OFFSCREEN_TAB || RUNNING_IN_TESTS;

      // Attempt to log in with the default password that is set when a user skips
      // password protection. This check needs to go first as we need to know
      // if default password was used.
      if (!encryptionKey.value && !autoLoginDisabledEnv) {
        try {
          await authenticateWithPassword(STUB_ACCOUNT.password);
          isUsingDefaultPassword.value = true;
        } catch (error) { /* NOOP */ }
      }

      // If default password auth failed, check if extension can be restored
      // by using data stored in the background process.
      if (!encryptionKey.value && !autoLoginDisabledEnv && IS_EXTENSION) {
        setLoaderVisible(true);
        const sessionEncryptionKey = await getSessionEncryptionKey();
        if (sessionEncryptionKey) {
          setEncryptionKey(sessionEncryptionKey);
          mnemonicDecrypted.value = await decrypt(sessionEncryptionKey, mnemonic.value);
          isAuthenticated.value = true;
        }
        setLoaderVisible(false);
      }

      // Finally if other attempts failed, ask user for the password.
      if (!encryptionKey.value) {
        await openPasswordLoginModal();
      }
    } else if (!isMnemonicEncrypted.value) {
      // Migrate the unprotected mnemonic by forcing user to set the password and encrypt it
      await setMnemonicAndInitializeAuthentication(mnemonic.value, true);
    }

    isAuthenticating.value = false;
  }

  async function logout() {
    setEncryptionKey(undefined);
    isAuthenticated.value = false;
  }

  async function lockWallet() {
    logout();
    checkUserAuth();
  }

  /**
   * Check if password provided by user is correct and if true update it to new one.
   */
  async function updatePassword(currentPassword: string, newPassword: string) {
    const key = await generateEncryptionKey(currentPassword, encryptionSalt.value!);
    await decrypt(key, mnemonicEncrypted.value!);
    await setPassword(newPassword);
  }

  (async () => {
    checkBiometricLoginAvailability();

    await watchUntilTruthy(() => mnemonic.value);

    if (!isMnemonicEncrypted.value) {
      mnemonicDecrypted.value = mnemonic.value;
    }

    if (!encryptionKey.value && IS_EXTENSION) {
      await checkUserAuth(); // Check auth when opening again the extension
    }
  })();

  if (IS_OFFSCREEN_TAB) {
    watch(
      encryptionSalt,
      () => syncBackgroundEncryptionKey(),
    );
  }

  /**
   * `isSessionExpired` is set to `false` whenever user is authenticated.
   * `isSessionExpired` is a web only feature that is in control of locking the
   * wallet after the tab was not active for a `secureLoginTimeout` amount of time.
   */
  watch(
    isAuthenticated,
    (val) => {
      if (val) {
        isSessionExpired = false;
      }
    },
  );

  watch(
    isAppActive,
    async (isActive, wasActive) => {
      // App resumed from background
      // Check if biometric auth is still available
      checkBiometricLoginAvailability({ forceUpdate: true });

      if (isActive && !wasActive) {
        clearInterval(expirationTimeout);

        // If session exists user needs to stay logged in
        if (!isAuthenticating.value) {
          const keepExtensionLoggedIn = !!(await getSessionEncryptionKey());
          if (isSessionExpired || (!keepExtensionLoggedIn && IS_EXTENSION)) {
            lockWallet();
          }
        }
      } else if (wasActive && !isActive) {
        expirationTimeout = setTimeout(
          () => {
            isSessionExpired = true;
          },
          +secureLoginTimeoutDecrypted.value!,
        );
      }
    },
  );

  return {
    isAuthenticated: readonly(isAuthenticated),
    isMnemonicRestored,
    isMnemonicEncrypted,
    isUsingDefaultPassword,
    mnemonic,
    mnemonicDecrypted,
    mnemonicEncrypted,
    mnemonicSeed,
    encryptionKey,
    encryptionSalt,
    generateMnemonic: () => generateMnemonic(wordlist),
    secureLoginTimeoutDecrypted,
    authenticateWithBiometry,
    authenticateWithPassword,
    checkBiometricLoginAvailability,
    checkUserAuth,
    getEncryptionKey,
    lockWallet,
    logout,
    setMnemonicAndInitializeAuthentication,
    setPassword,
    updatePassword,
  };
});
