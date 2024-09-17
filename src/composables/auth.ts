import { BiometricAuth } from '@aparajita/capacitor-biometric-auth';
import {
  readonly,
  ref,
  watch,
} from 'vue';

import { tg as t } from '@/popup/plugins/i18n';
import { IS_MOBILE_APP, MODAL_ENABLE_BIOMETRIC_LOGIN, MODAL_BIOMETRIC_LOGIN } from '@/constants';
import {
  authenticateWithPassword,
  getSessionEncryptionKey,
  sleep,
  watchUntilTruthy,
} from '@/utils';
import { useUi } from './ui';
import { useModals } from './modals';
import { useAccounts } from './accounts';
import { createCustomScopedComposable } from './composablesHelpers';

export const useAuth = createCustomScopedComposable(() => {
  let composableInitialized = false;

  const biometricAuth = {
    available: false,
    updating: false,
    checked: false,
  };

  /** Common state for both biometric or password protection */
  const isAuthenticated = ref(false);
  const isAuthenticating = ref(false);

  const {
    isBiometricLoginEnabled,
    lastTimeAppWasActive,
    secureLoginTimeout,
    isAppActive,
    setBiometricLoginEnabled,
  } = useUi();
  const { openModal } = useModals();
  const {
    isLoggedIn,
    encryptionKey,
    setEncryptionKey,
    openPasswordLoginModal,
  } = useAccounts();

  /**
   * TODO: Updating the authentication status from outside of the composable should be not allowed
   */
  function setAuthenticated(val: boolean) {
    isAuthenticated.value = val;
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

  /**
   * Checks if the user should be kept logged in based on the current session.
   */
  async function shouldKeepExtensionLoggedIn() {
    return !!(await getSessionEncryptionKey());
  }

  async function logout() {
    setEncryptionKey(null);
    isAuthenticated.value = false;
  }

  /**
   * Open biometric login or password login modal depending on the environment settings.
   */
  async function checkUserAuth(): Promise<any> {
    if (!isAuthenticating.value && !isAuthenticated.value && isLoggedIn.value) {
      isAuthenticating.value = true;
      if (IS_MOBILE_APP) {
        if (isBiometricLoginEnabled.value && await checkBiometricLoginAvailability()) {
          await openModal(MODAL_BIOMETRIC_LOGIN);
        }
      } else if (!encryptionKey.value) {
        await openPasswordLoginModal();
      }

      // Wait before resetting isAuthenticated so that app doesn't register a false app resume event
      await sleep(500);

      isAuthenticating.value = false;
    }
  }

  async function lockWallet() {
    logout();
    checkUserAuth();
  }

  async function openEnableBiometricLoginModal() {
    if (await checkBiometricLoginAvailability()) {
      openModal(MODAL_ENABLE_BIOMETRIC_LOGIN);
    }
  }

  (async () => {
    if (composableInitialized) {
      return;
    }
    composableInitialized = true;
    await checkBiometricLoginAvailability();
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
        const keepExtensionLoggedIn = await shouldKeepExtensionLoggedIn();
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
    isAuthenticated: readonly(isAuthenticated),
    setAuthenticated,
    checkBiometricLoginAvailability,
    authenticate,
    lockWallet,
    logout,
    checkUserAuth,
    openEnableBiometricLoginModal,
  };
});
