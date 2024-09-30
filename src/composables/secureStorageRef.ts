import { Ref, ref, watch } from 'vue';

import type { IEncryptionResult, StorageKey } from '@/types';
import { IS_MOBILE_APP } from '@/constants';
import { decrypt, encrypt, watchUntilTruthy } from '@/utils';
import { WalletStorage } from '@/lib/WalletStorage';
import { type ICreateStorageRefOptions, useStorageRef } from './storageRef';

interface ICreateSecureStorageRefOptions<T> extends
    Omit<ICreateStorageRefOptions<T>, 'serializer' | 'enableSecureStorage' | 'onBackgroundSync'> {
  encryptionDisabled?: boolean;
  isStoredUnencrypted?: (val: T | null) => boolean;
  onStoredUnencrypted?: (val: T | null) => any;
}

/**
 * Create a secure storage ref that encrypts and decrypts the value using the password.
 * Is a wrapper around the useStorageRef composable.
 * On mobile, the encryption and decryption are handled by the storageRef composable
 * because we are using the SecureMobileStorage.
 */
export function useSecureStorageRef<T = string | object | any[]>(
  initialState: T,
  storageKey: StorageKey,
  encryptionKey: Ref<CryptoKey | undefined>,
  options: ICreateSecureStorageRefOptions<T> = {
    encryptionDisabled: IS_MOBILE_APP,
  },
): Ref<T> {
  /**
   * Checks if the value needs to be decrypted and decrypts it using the encryption key.
   * On mobile, the value is already decrypted by the storageRef composable.
   */
  async function getDecryptedValue(val: any): Promise<T> {
    if (
      options.encryptionDisabled
      || val === null
      || val === undefined
      || options.isStoredUnencrypted?.(val)
    ) {
      return val;
    }
    await watchUntilTruthy(encryptionKey);
    if (encryptionKey.value) {
      let decryptedValue;
      try {
        decryptedValue = await decrypt(encryptionKey.value, val);
      } catch {
        throw new Error('Failed to decrypt the value');
      }
      try {
        return JSON.parse(decryptedValue);
      } catch {
        return decryptedValue as T;
      }
    }
    throw new Error('Failed to read the value');
  }

  /**
   * Checks if the value needs to be encrypted and encrypts it using the encryption key.
   * On mobile, the value is already encrypted by the storageRef composable.
   */
  async function getEncryptedValue(val: any): Promise<IEncryptionResult> {
    if (options.encryptionDisabled) {
      return val;
    }

    await watchUntilTruthy(encryptionKey);
    if (encryptionKey.value) {
      return encrypt(encryptionKey.value, val);
    }
    throw new Error('Failed to write the value');
  }

  const decryptedState = ref(initialState) as Ref<T>;
  /**
   * Do not sync encryptedState with decryptedState while logged out
   * because decryptedState is reset during logout.
   */
  const sessionExists = ref(false);
  const isUpdatingEncryptedState = ref(false);

  /** Should always hold encrypted values (both on storage and state) */
  const encryptedState = useStorageRef<IEncryptionResult | null>(null, storageKey, {
    ...options,
    migrations: options.migrations as any,
    enableSecureStorage: true,
    // Handle write operation within the composable but read from storageRef
    serializer: {
      read: getDecryptedValue,
      write: (val) => val,
    },
    onRestored: async (val: IEncryptionResult) => {
      if (val) {
        const decryptedValue = await getDecryptedValue(val);
        decryptedState.value = decryptedValue;
        options.onRestored?.(decryptedValue);
      }
    },
    onBackgroundSync: async (val: IEncryptionResult) => {
      decryptedState.value = await getDecryptedValue(val);
    },
  });

  async function setEncryptedState(val: T) {
    isUpdatingEncryptedState.value = true;
    encryptedState.value = await getEncryptedValue(val);
    isUpdatingEncryptedState.value = false;
  }

  // Restore state and run watchers
  (async () => {
    const restoredValue = WalletStorage.get<T | null>(storageKey);

    if (initialState && !restoredValue) {
      await setEncryptedState(initialState);
    }

    if (restoredValue !== null) {
      decryptedState.value = restoredValue;
      if (options.isStoredUnencrypted?.(restoredValue)) {
        options.onStoredUnencrypted?.(restoredValue);
      }
      if (options.isStoredUnencrypted?.(restoredValue) || IS_MOBILE_APP) {
        WalletStorage.remove(storageKey);
      }
    }

    /**
     * Clear the state when the user logs out.
     * Ensures that the state is not leaked if an attacker removes the login modal from the DOM.
     */
    if (!IS_MOBILE_APP) {
      watch(encryptionKey, async (key) => {
        if (!key) {
          sessionExists.value = false;
          decryptedState.value = null as T;
        } else {
          sessionExists.value = true;
          await watchUntilTruthy(() => !isUpdatingEncryptedState.value);

          // We need to update the encrypted state so that it is decrypted with the new key.
          // If decryptedState is set then it means that the password changed.
          if (decryptedState.value !== null) {
            // Password changed, re-encrypt state
            setEncryptedState(decryptedState.value);
          } else {
            // Resumed from being inactive, decrypt state
            decryptedState.value = await getDecryptedValue(encryptedState.value);
          }
        }
      }, { deep: true });
    }

    /**
     * Synchronize the inner state with the decrypted state.
     */
    watch(decryptedState, async (val) => {
      options.onRestored?.(val);
      if (
        !isUpdatingEncryptedState.value
        && (sessionExists.value || IS_MOBILE_APP)
      ) {
        await setEncryptedState(val);
      }
    }, { immediate: true, deep: true });
  })();

  return decryptedState;
}
