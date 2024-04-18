import { BiometricAuth } from '@aparajita/capacitor-biometric-auth';
import {
  ref,
  readonly,
  watch,
} from 'vue';

import { tg as t } from '@/popup/plugins/i18n';
import { IS_MOBILE_APP, MODAL_ENABLE_SECURE_LOGIN, MODAL_SECURE_LOGIN } from '@/constants';
import { watchUntilTruthy } from '@/utils';
import { useUi } from './ui';
import { useModals } from './modals';
import { createCustomScopedComposable } from './composablesHelpers';

export const useAuth = createCustomScopedComposable(() => {
  let composableInitialized = false;
  let isSecureLoginAvailable = false;
  const isBiometryAvailabilityUpdating = ref(false);
  const isBiometryAvailabilityChecked = ref(false);
  const isAuthenticated = ref(false);
  const isAuthenticating = ref(false);

  const {
    setSecureLoginEnabled,
    isSecureLoginEnabled,
    lastTimeAppWasActive,
    secureLoginTimeout,
    isAppActive,
  } = useUi();
  const { openModal } = useModals();

  async function checkSecureLoginAvailability({ forceUpdate = false } = {}) {
    if (isBiometryAvailabilityUpdating.value) {
      await watchUntilTruthy(() => !isBiometryAvailabilityUpdating.value);
    } else if (!isBiometryAvailabilityChecked.value || forceUpdate) {
      isBiometryAvailabilityUpdating.value = true;
      isSecureLoginAvailable = (await BiometricAuth.checkBiometry()).isAvailable;
      isBiometryAvailabilityChecked.value = true;
      isBiometryAvailabilityUpdating.value = false;
    }
    if (!isSecureLoginAvailable) {
      setSecureLoginEnabled(false);
    }
    return isSecureLoginAvailable;
  }

  /**
   * Prompts the user to authenticate using biometric authentication.
   * Returns a promise that resolves when the user is authenticated
   * or if biometric authentication is not available.
   */
  async function authenticate(): Promise<void> {
    if (
      !await checkSecureLoginAvailability()
      || !isSecureLoginEnabled.value
      || isAuthenticated.value
    ) {
      return Promise.resolve();
    }

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
  }

  function logout() {
    isAuthenticated.value = false;
  }

  async function openSecureLoginModal() {
    if (
      !isAuthenticating.value
      && await checkSecureLoginAvailability()
      && isSecureLoginEnabled.value
      && !isAuthenticated.value
    ) {
      isAuthenticating.value = true;
      await openModal(MODAL_SECURE_LOGIN);
      // wait before resetting isAuthenticated so that app doesn't register a false app resume event
      await new Promise((resolve) => setTimeout(resolve, 500));
      isAuthenticating.value = false;
    }
  }

  async function openEnableSecureLoginModal() {
    if (IS_MOBILE_APP) {
      openModal(MODAL_ENABLE_SECURE_LOGIN);
    }
  }

  (async () => {
    if (composableInitialized) {
      return;
    }
    composableInitialized = true;
    await checkSecureLoginAvailability();
  })();

  watch(
    isAppActive,
    async (isActive, wasActive) => {
      // App resumed from background
      // Check if biometric auth is still available
      await checkSecureLoginAvailability({ forceUpdate: true });
      if (
        !isAuthenticating.value
        && isSecureLoginEnabled.value
        && isActive
        && !wasActive
        && IS_MOBILE_APP
      ) {
        if (isAuthenticated.value && lastTimeAppWasActive.value) {
          const elapsedTime = Date.now() - lastTimeAppWasActive.value;
          if (elapsedTime > secureLoginTimeout.value) {
            logout();
            await openSecureLoginModal();
          }
        } else if (!isAuthenticated.value) {
          await openSecureLoginModal();
        }
      }
    },
  );

  return {
    isAuthenticated: readonly(isAuthenticated),
    checkSecureLoginAvailability,
    authenticate,
    logout,
    openSecureLoginModal,
    openEnableSecureLoginModal,
  };
});
