import { computed, ref, watch } from 'vue';
import { isEqual } from 'lodash-es';

import type { IKey } from '@/types';
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

  async function init(newPasswordKey: IKey | null) {
    if (IS_MOBILE_APP) {
      secureStorage.value = SecureMobileStorage;
    } else {
      if (!newPasswordKey) {
        if (secureStorage.value) {
          secureStorage.value = undefined;
        }
        return;
      }
      secureStorage.value = new EncryptedStorage(newPasswordKey);
    }
  }

  watch(passwordKey, (newPasswordKey, oldPasswordKey) => {
    if (newPasswordKey && !isEqual(newPasswordKey, oldPasswordKey)) {
      init(newPasswordKey);
    }
  });

  (async () => {
    if (!composableInitialized) {
      composableInitialized = true;
      init(passwordKey.value);
    }
  })();
  return {
    isLoggedIn,
    secureStorage,
  };
});
