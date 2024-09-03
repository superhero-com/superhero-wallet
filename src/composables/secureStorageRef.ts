import { Ref, ref, watch } from 'vue';
import { validateMnemonic } from '@aeternity/bip39';

import type { StorageKey } from '@/types';
import { decrypt, encrypt, watchUntilTruthy } from '@/utils';
import { IS_MOBILE_APP, STORAGE_KEYS } from '@/constants';
import { WalletStorage } from '@/lib/WalletStorage';
import { useAccounts } from './accounts';
import { type ICreateStorageRefOptions, useStorageRef } from './storageRef';

/**
 * Create a secure storage ref that encrypts and decrypts the value using the password.
 * Is a wrapper around the useStorageRef composable.
 */
export function useSecureStorageRef<T = string | object | any[]>(
  initialState: T,
  storageKey: StorageKey,
  options: Omit<ICreateStorageRefOptions<T>, 'serializer' | 'isSecure' > = {},
) {
  const isWriting = ref(false);

  async function getDecryptedValue(encryptedValue: any) {
    if (IS_MOBILE_APP || !encryptedValue) {
      return encryptedValue;
    }
    watchUntilTruthy(() => !isWriting.value);
    const { passwordKey } = useAccounts();
    await watchUntilTruthy(passwordKey);
    if (passwordKey.value) {
      try {
        const decryptedValue = await decrypt(passwordKey.value, encryptedValue);
        try {
          return JSON.parse(decryptedValue);
        } catch (e) {
          return decryptedValue;
        }
      } catch (e) {
        throw new Error('Failed to decrypt the value');
      }
    }
    throw new Error('Failed to read the value, probably the password is not set');
  }

  async function getEncryptedValue(val: any): Promise<T> {
    if (IS_MOBILE_APP || !val) {
      return val;
    }
    isWriting.value = true;
    const { passwordKey } = useAccounts();
    await watchUntilTruthy(passwordKey);
    if (passwordKey.value) {
      isWriting.value = false;
      return encrypt(passwordKey.value, val) as T;
    }
    isWriting.value = false;
    throw new Error('Failed to write the value');
  }

  const decryptedState = ref(initialState) as Ref<T>;

  /** Should always hold encrypted values (both on storage and state) */
  const innerState = useStorageRef<T>(null as T, storageKey, {
    ...options,
    isSecure: true,
    // Handle write operation within the composable but read from storageRef
    serializer: {
      read: getDecryptedValue,
      write: (val) => val,
    },
    onRestored: async (val: T) => {
      if (val) {
        if (!IS_MOBILE_APP) {
          const { passwordKey } = useAccounts();
          await watchUntilTruthy(passwordKey);
        }
        const decryptedValue = await getDecryptedValue(val);
        decryptedState.value = decryptedValue;
        options.onRestored?.(decryptedValue);
      }
    },
  });

  /**
   * This is an exception for the mnemonic because it's a key part of the password feature.
   */
  async function setMnemonicOnAccounts(mnemonic: T) {
    if (mnemonic && validateMnemonic(mnemonic)) {
      const { setMnemonic } = useAccounts();
      await setMnemonic(mnemonic as string, true);
      options.onRestored?.(mnemonic);
    }
  }

  // Restore state and run watchers
  (async () => {
    // Check if value exists in insecure storage and migrate it to secure storage
    const decryptedValue = await WalletStorage.get<T | null>(storageKey);
    if (decryptedValue && storageKey === STORAGE_KEYS.mnemonic) {
      await setMnemonicOnAccounts(decryptedValue);
    }

    if (IS_MOBILE_APP) {
      // TODO Needs to be tested
      // Move the unencrypted value to secure storage and remove it from insecure storage
      if (decryptedValue !== null) {
        decryptedState.value = decryptedValue;
        WalletStorage.remove(storageKey);
      }
    }

    /**
     * Clear the state when the user logs out.
     * This ensures that the state is not leaked if someone removes the modal from the DOM.
     */
    const { passwordKey } = useAccounts();
    watch(passwordKey, async (val) => {
      if (IS_MOBILE_APP) {
        return;
      }
      if (!val) {
        decryptedState.value = initialState;
      } else {
        decryptedState.value = await getDecryptedValue(innerState.value);
      }
    }, { immediate: true, deep: true });

    /**
     * Synchronize the inner state with the decrypted state.
     */
    watch(decryptedState, async (val) => {
      options.onRestored?.(val);
      // Do not write null values to the mnemonic storage
      if (val || (storageKey !== STORAGE_KEYS.mnemonic)) {
        innerState.value = await getEncryptedValue(val);
      }
    }, { immediate: true, deep: true });
  })();

  return decryptedState;
}
