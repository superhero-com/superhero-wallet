import { computed, ref, watch } from 'vue';
import { IS_MOBILE_APP } from '@/constants';
import { IWalletStorage } from '@/lib/WalletStorage';
import { SecureMobileStorage } from '@/lib/SecureMobileStorage';
import { EncryptedStorage } from '@/lib/EncryptedStorage';
import { createCustomScopedComposable } from './composablesHelpers';
import { useAccounts } from './accounts';

export const useSecureStorage = createCustomScopedComposable(() => {
  let composableInitialized = false;
  const secureStorage = ref<IWalletStorage>();

  const { passwordKey } = useAccounts();

  const isLoggedIn = computed(() => passwordKey.value || IS_MOBILE_APP);

  async function init() {
    if (IS_MOBILE_APP) {
      secureStorage.value = SecureMobileStorage;
    } else {
      if (!passwordKey.value) {
        console.log('[useSecureStorage]: Password key is missing.');
        if (secureStorage.value) {
          secureStorage.value = undefined;
        }
        return;
      }
      secureStorage.value = new EncryptedStorage(passwordKey.value);
    }
  }

  watch(passwordKey, (newPasswordKey, oldPasswordKey) => {
    if (oldPasswordKey !== newPasswordKey) {
      init();
    }
  });

  (async () => {
    if (!composableInitialized) {
      composableInitialized = true;
      init();
    }
  })();
  return {
    isLoggedIn,
    secureStorage,
  };
});
