import { BiometricAuth } from '@aparajita/capacitor-biometric-auth';
import {
  ref,
  readonly,
  watch,
} from 'vue';

import { tg as t } from '@/popup/plugins/i18n';
import {
  IS_EXTENSION,
  IS_MOBILE_APP,
  MODAL_ENABLE_BIOMETRIC_LOGIN,
  MODAL_SECURE_LOGIN,
} from '@/constants';
import { authenticateWithPassword, getSessionKey, watchUntilTruthy } from '@/utils';
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
  } = useUi();
  const { openModal } = useModals();
  const {
    isLoggedIn,
    passwordKey,
    setPasswordKey,
    openLoginModal,
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

    if (isBiometricLoginEnabled.value && await checkBiometricLoginAvailability()) {
      try {
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
      } catch (error) {
        return Promise.reject(error);
      }
    } else if (!IS_MOBILE_APP) {
      return authenticateWithPassword(password!).then((key) => {
        setPasswordKey(key);
        isAuthenticated.value = true;
      });
    }
    return Promise.resolve();
  }

  async function logout() {
    if (IS_EXTENSION) {
      const sessionKey = await getSessionKey();
      if (sessionKey) {
        return;
      }
    }
    setPasswordKey(null);
    isAuthenticated.value = false;
  }

  async function openSecureLoginModal() {
    if (!isAuthenticating.value && !isAuthenticated.value && isLoggedIn.value) {
      isAuthenticating.value = true;
      if (isBiometricLoginEnabled.value && await checkBiometricLoginAvailability()) {
        await openModal(MODAL_SECURE_LOGIN);
      } else if (!IS_MOBILE_APP && !passwordKey.value) {
        await openLoginModal();
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
        if (isAuthenticated.value && lastTimeAppWasActive.value) {
          const elapsedTime = Date.now() - lastTimeAppWasActive.value;
          if (elapsedTime > secureLoginTimeout.value) {
            logout();
            await openSecureLoginModal();
          }
        } else if (!isAuthenticated.value) {
          logout();
          await openSecureLoginModal();
        }
      }
    },
  );

  return {
    isAuthenticated: readonly(isAuthenticated),
    checkBiometricLoginAvailability,
    authenticate,
    logout,
    openSecureLoginModal,
    openEnableBiometricLoginModal,
  };
});
