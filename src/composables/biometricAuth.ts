import { BiometricAuth } from '@aparajita/capacitor-biometric-auth';
import { ref, readonly } from 'vue';

import { tg as t } from '@/popup/plugins/i18n';
import { IS_MOBILE_APP, MODAL_ENABLE_SECURE_LOGIN, MODAL_SECURE_LOGIN } from '@/constants';
import { useUi } from './ui';
import { useModals } from './modals';

let composableInitialized = false;
const isAvailable = ref(false);
const isAuthenticated = ref(false);

export function useBiometricAuth() {
  const { isSecureLoginEnabled } = useUi();
  const { openModal } = useModals();

  async function checkIsAvailable() {
    isAvailable.value = (await BiometricAuth.checkBiometry()).isAvailable;
  }

  /**
   * Prompts the user to authenticate using biometric authentication.
   * Returns a promise that resolves when the user is authenticated
   * or if biometric authentication is not available.
   */
  async function authenticate(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!isAvailable.value || !isSecureLoginEnabled.value) {
        resolve();
        return;
      }
      try {
        resolve(BiometricAuth.authenticate({
          reason: t('biometricAuth.reason'),
          cancelTitle: t('common.cancel'),
          allowDeviceCredential: true,
          iosFallbackTitle: t('biometricAuth.fallbackTitle'),
          androidTitle: t('biometricAuth.title'),
          androidSubtitle: t('biometricAuth.subtitle'),
          androidConfirmationRequired: false,
        }).then(() => {
          isAuthenticated.value = true;
        }));
      } catch (error) {
        reject(error);
      }
    });
  }

  function deauthenticate() {
    isAuthenticated.value = false;
  }

  async function openAuthModal() {
    if (isAvailable.value && isSecureLoginEnabled.value) {
      await openModal(MODAL_SECURE_LOGIN);
    }
  }

  async function openEnableBiometricAuthModal() {
    if (IS_MOBILE_APP) {
      openModal(MODAL_ENABLE_SECURE_LOGIN);
    }
  }

  (async () => {
    if (composableInitialized) {
      return;
    }
    await checkIsAvailable();
    composableInitialized = true;
  })();

  return {
    isAvailable: readonly(isAvailable),
    isAuthenticated: readonly(isAuthenticated),
    authenticate,
    deauthenticate,
    checkIsAvailable,
    openAuthModal,
    openEnableBiometricAuthModal,
  };
}
