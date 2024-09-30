import { BiometricAuth } from '@aparajita/capacitor-biometric-auth';
import {
  computed,
  readonly,
  ref,
  watch,
} from 'vue';
import { generateMnemonic, mnemonicToSeed, validateMnemonic } from '@aeternity/bip39';

import { tg as t } from '@/popup/plugins/i18n';
import {
  IS_EXTENSION,
  IS_IOS,
  IS_MOBILE_APP,
  IS_OFFSCREEN_TAB,
  MODAL_BIOMETRIC_LOGIN,
  MODAL_ENABLE_BIOMETRIC_LOGIN,
  MODAL_PASSWORD_LOGIN,
  MODAL_SET_PASSWORD,
  STORAGE_KEYS,
  UNFINISHED_FEATURES,
} from '@/constants';
import { STUB_ACCOUNT } from '@/constants/stubs';
import {
  authenticateWithPassword,
  endSession,
  generateEncryptionKey,
  getSessionEncryptionKey,
  sleep,
  startSession,
  watchUntilTruthy,
} from '@/utils';

import { WalletStorage } from '@/lib/WalletStorage';
import { SecureMobileStorage } from '@/lib/SecureMobileStorage';

import migrateMnemonicVuexToComposable from '@/migrations/002-mnemonic-vuex-to-composable';
import migrateMnemonicCordovaToIonic from '@/migrations/008-mnemonic-cordova-to-ionic';

import { useUi } from './ui';
import { useModals } from './modals';
import { createCustomScopedComposable } from './composablesHelpers';
import { useSecureStorageRef } from './secureStorageRef';
import { useAeSdk } from './aeSdk';

const CHECK_FOR_SESSION_KEY_INTERVAL = 5000;

export const useAuth = createCustomScopedComposable(() => {
  const {
    isBiometricLoginEnabled,
    lastTimeAppWasActive,
    secureLoginTimeout,
    isAppActive,
    setBiometricLoginEnabled,
    setLoaderVisible,
  } = useUi();
  const { openModal, modalsOpen } = useModals();

  /** Common state for both biometric or password protection */
  const isAuthenticated = ref(false);
  const isAuthenticating = ref(false);
  const isMnemonicRestored = ref(false);
  const encryptionKey = ref<CryptoKey>();
  const isStoredUnencrypted = ref(false);

  const mnemonic = useSecureStorageRef<string>(
    '',
    STORAGE_KEYS.mnemonic,
    encryptionKey,
    {
      backgroundSync: true,
      encryptionDisabled: IS_MOBILE_APP,
      migrations: [
        ...((IS_IOS && IS_MOBILE_APP) ? [migrateMnemonicCordovaToIonic] : []),
        migrateMnemonicVuexToComposable,
      ],
      isStoredUnencrypted: (val: any) => val && validateMnemonic(val),
      onStoredUnencrypted: () => { isStoredUnencrypted.value = true; },
      onRestored: async (val: any) => {
        const hasStoredMnemonic = (
          WalletStorage.get(STORAGE_KEYS.mnemonic)
          || await SecureMobileStorage.get(STORAGE_KEYS.mnemonic)
        );
        /**
          * If mnemonic is stored raw it means that it is an old state and
          * wallet needs to initiate the password
          */
        if (isStoredUnencrypted.value && !IS_MOBILE_APP) {
          isStoredUnencrypted.value = false;
          // eslint-disable-next-line no-use-before-define
          await initializePassword();
          isAuthenticated.value = true;
        }
        isMnemonicRestored.value = !!val || !hasStoredMnemonic;
      },
    },
  );

  const mnemonicSeed = computed(() => mnemonic.value ? mnemonicToSeed(mnemonic.value) : null);

  const biometricAuth = {
    available: false,
    updating: false,
    checked: false,
  };

  /**
   * TODO: Updating the authentication status from outside of the composable should be not allowed
   */
  function setAuthenticated(val: boolean) {
    isAuthenticated.value = val;
  }

  /**
   * Setting/Resetting the password key logs the user in/out.
   */
  function setEncryptionKey(newEncryptionKey?: CryptoKey) {
    encryptionKey.value = newEncryptionKey;
    if (IS_EXTENSION) {
      if (newEncryptionKey) {
        startSession(newEncryptionKey, secureLoginTimeout.value);
      } else {
        endSession();
      }
    }
  }

  async function getEncryptionKey() {
    return watchUntilTruthy(encryptionKey);
  }

  async function setPassword(password: string) {
    const newEncryptionKey = await generateEncryptionKey(password);
    setEncryptionKey(newEncryptionKey);
  }

  /**
   * Checks if biometric authentication is available on the device.
   */
  async function checkBiometricLoginAvailability({ forceUpdate = false } = {}) {
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
   * Prompts the user to authenticate using biometric authentication.
   * Returns a promise that resolves when the user is authenticated
   * or if biometric authentication is not available.
   */
  async function authenticate(password?: string): Promise<void> {
    if (isAuthenticated.value) {
      return Promise.resolve();
    }

    if (IS_MOBILE_APP) {
      if (isBiometricLoginEnabled.value && await checkBiometricLoginAvailability()) {
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
        });
      }
    } else {
      return authenticateWithPassword(password!).then(({ encryptionKey: newEncryptionKey }) => {
        setEncryptionKey(newEncryptionKey);
        isAuthenticated.value = true;
      });
    }
    return Promise.resolve();
  }

  async function requestUserPassword() {
    setLoaderVisible(true);
    const sessionEncryptionKey = await getSessionEncryptionKey();
    if (sessionEncryptionKey) {
      setEncryptionKey(sessionEncryptionKey);
      const { getAeSdk } = useAeSdk();
      await getAeSdk();
      setLoaderVisible(false);
      isAuthenticated.value = true;
      return;
    }
    setLoaderVisible(false);

    if (!IS_OFFSCREEN_TAB) {
      // In development mode try to authenticate with default password
      // If developer is not using default password, he can still login with the new password
      if (UNFINISHED_FEATURES) {
        await authenticate(STUB_ACCOUNT.password).catch(async () => {
          await openModal(MODAL_PASSWORD_LOGIN);
        });
      } else {
        await openModal(MODAL_PASSWORD_LOGIN);
      }
      if (!encryptionKey.value) {
        throw new Error('encryptionKey was not set after login.');
      }
    }
  }

  async function updatePassword(currentPassword: string, newPassword: string) {
    const { decryptedMnemonic } = await authenticateWithPassword(currentPassword);
    if (decryptedMnemonic) {
      await setPassword(newPassword);
    }
  }

  async function initializePassword(isRestored = false) {
    if (!IS_MOBILE_APP) {
      const { openSetPasswordModal } = useModals();

      const password = await openSetPasswordModal(isRestored).catch(() => {
        throw new Error('Password was not set.');
      });

      await setPassword(password);
    }
  }

  async function setMnemonicAndInitializePassword(newMnemonic: string, isRestored = false) {
    initializePassword(isRestored);
    mnemonic.value = newMnemonic;
  }

  async function setGeneratedMnemonic() {
    await setMnemonicAndInitializePassword(generateMnemonic()).catch(() => {
      throw new Error('Mnemonic was not set.');
    });
  }

  async function syncBackgroundEncryptionKey() {
    await new Promise<void>((resolve) => {
      const interval = setInterval(async () => {
        const sessionEncryptionKey = await getSessionEncryptionKey();
        if (sessionEncryptionKey) {
          setEncryptionKey(sessionEncryptionKey);
          clearInterval(interval);
          resolve();
        }
      }, CHECK_FOR_SESSION_KEY_INTERVAL);
    });
  }

  async function openEnableBiometricLoginModal() {
    if (await checkBiometricLoginAvailability()) {
      openModal(MODAL_ENABLE_BIOMETRIC_LOGIN);
    }
  }

  /**
   * Open biometric login or password login modal depending on the environment settings.
   */
  async function checkUserAuth(): Promise<any> {
    if (!isAuthenticating.value && !isAuthenticated.value) {
      isAuthenticating.value = true;
      if (IS_MOBILE_APP) {
        if (isBiometricLoginEnabled.value && await checkBiometricLoginAvailability()) {
          await openModal(MODAL_BIOMETRIC_LOGIN);
        }
      } else if (
        !encryptionKey.value
        && mnemonic.value
        // Do not show `openPasswordLoginModal` if user currently initiating password
        && !modalsOpen.value.find(({ name }) => name === MODAL_SET_PASSWORD)) {
        await requestUserPassword();
      }

      // Wait before resetting isAuthenticated so that app doesn't register a false app resume event
      await sleep(500);

      isAuthenticating.value = false;
    }
  }

  async function logout() {
    setEncryptionKey(undefined);
    isAuthenticated.value = false;
  }

  async function lockWallet() {
    logout();
    checkUserAuth();
  }

  (async () => {
    checkBiometricLoginAvailability();

    const encryptedMnemonicExists = !!(WalletStorage.get<string>(STORAGE_KEYS.mnemonic));
    if (
      !encryptionKey.value
        && !IS_MOBILE_APP
        && encryptedMnemonicExists
    ) {
      await checkUserAuth();
    }

    if (IS_OFFSCREEN_TAB && !encryptionKey.value) {
      await syncBackgroundEncryptionKey();
    }
  })();

  watch(
    isAppActive,
    async (isActive, wasActive) => {
      // App resumed from background
      // Check if biometric auth is still available
      await checkBiometricLoginAvailability({ forceUpdate: true });
      if (
        !isAuthenticating.value
        && isActive
        && !wasActive
      ) {
        // If session exists user needs to stay logged in
        const keepExtensionLoggedIn = !!(await getSessionEncryptionKey());
        if (isAuthenticated.value && lastTimeAppWasActive.value) {
          const elapsedTime = Date.now() - lastTimeAppWasActive.value;
          if (elapsedTime > secureLoginTimeout.value && !keepExtensionLoggedIn) {
            lockWallet();
          }
        } else if (!isAuthenticated.value && !keepExtensionLoggedIn) {
          lockWallet();
        }
      }
    },
  );

  return {
    initializePassword,
    isAuthenticated: readonly(isAuthenticated),
    isMnemonicRestored,
    mnemonic,
    mnemonicSeed,
    encryptionKey,
    getEncryptionKey,
    setAuthenticated,
    setGeneratedMnemonic,
    setMnemonicAndInitializePassword,
    checkBiometricLoginAvailability,
    updatePassword,
    authenticate,
    lockWallet,
    logout,
    checkUserAuth,
    openEnableBiometricLoginModal,
  };
});
