import { BiometricAuth } from '@aparajita/capacitor-biometric-auth';
import {
  ref,
  readonly,
  watch,
} from 'vue';

import { tg as t } from '@/popup/plugins/i18n';
import { IS_MOBILE_APP, MODAL_ENABLE_BIOMETRIC_LOGIN, MODAL_SECURE_LOGIN } from '@/constants';
import { authenticateWithPassword, getSessionEncryptionKey, watchUntilTruthy } from '@/utils';
import { useUi } from './ui';
import { useModals } from './modals';
import { useAccounts } from './accounts';
import { createCustomScopedComposable } from './composablesHelpers';

export const useAuth = createCustomScopedComposable(() => {
  let composableInitialized = false;
  let isBiometricAuthAvailable = false;
  const isBiometryAvailabilityUpdating = ref(false);
  const isBiometryAvailabilityChecked = ref(false);
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
   * Checks if biometric authentication is available on the device.
   */
  async function checkBiometricLoginAvailability({ forceUpdate = false } = {}) {
    if (isBiometryAvailabilityUpdating.value) {
      await watchUntilTruthy(() => !isBiometryAvailabilityUpdating.value);
    } else if (!isBiometryAvailabilityChecked.value || forceUpdate) {
      isBiometryAvailabilityUpdating.value = true;
      isBiometricAuthAvailable = (await BiometricAuth.checkBiometry()).isAvailable;
      isBiometryAvailabilityChecked.value = true;
      isBiometryAvailabilityUpdating.value = false;
    }
    if (!isBiometricAuthAvailable && isBiometricLoginEnabled.value) {
      setBiometricLoginEnabled(false);
    }
    return isBiometricAuthAvailable;
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

  async function checkUserAuth() {
    if (!isAuthenticating.value && !isAuthenticated.value && isLoggedIn.value) {
      isAuthenticating.value = true;
      if (IS_MOBILE_APP) {
        if (isBiometricLoginEnabled.value && await checkBiometricLoginAvailability()) {
          await openModal(MODAL_SECURE_LOGIN);
        }
      } else if (!encryptionKey.value) {
        await openPasswordLoginModal();
      }
      // wait before resetting isAuthenticated so that app doesn't register a false app resume event
      await new Promise((resolve) => setTimeout(resolve, 500));
      isAuthenticating.value = false;
    }
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
            logout();
            await checkUserAuth();
          }
        } else if (!isAuthenticated.value && !keepExtensionLoggedIn) {
          logout();
          await checkUserAuth();
        }
      }
    },
  );

  return {
    isAuthenticated: readonly(isAuthenticated),
    checkBiometricLoginAvailability,
    authenticate,
    logout,
    checkUserAuth,
    openEnableBiometricLoginModal,
  };
});
