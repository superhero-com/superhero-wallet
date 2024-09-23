import { Ref, ref, watch } from 'vue';
import type { IEncryptionResult, StorageKey } from '@/types';
import { IS_MOBILE_APP } from '@/constants';
import { decrypt, encrypt, watchUntilTruthy } from '@/utils';
import { WalletStorage } from '@/lib/WalletStorage';
import { useAccounts } from './accounts';
import { type ICreateStorageRefOptions, useStorageRef } from './storageRef';

interface ICreateSecureStorageRefOptions<T> extends
    Omit<ICreateStorageRefOptions<T>, 'serializer' | 'enableSecureStorage' | 'onBackgroundSync'> {
  encryptionDisabled?: boolean;
}

type SecureStorageReturn<T> = [
  decryptedState: Ref<T>,
  encryptedState: Ref<IEncryptionResult | null>,
];

/**
 * Create a secure storage ref that encrypts and decrypts the value using the password.
 * Is a wrapper around the useStorageRef composable.
 * On mobile, the encryption and decryption are handled by the storageRef composable
 * because we are using the SecureMobileStorage.
 */
export function useSecureStorageRef<T = string | object | any[]>(
  initialState: T,
  storageKey: StorageKey,
  options: ICreateSecureStorageRefOptions<T> = {
    encryptionDisabled: IS_MOBILE_APP,
  },
): SecureStorageReturn<T> {
  /**
   * Checks if the value needs to be decrypted and decrypts it using the encryption key.
   * On mobile, the value is already decrypted by the storageRef composable.
   */
  async function getDecryptedValue(val: any): Promise<T> {
    if (options.encryptionDisabled || val === null || val === undefined) {
      return val;
    }
    const { getEncryptionKey } = useAccounts();
    const encryptionKey = await getEncryptionKey();
    if (encryptionKey) {
      let decryptedValue;
      try {
        decryptedValue = await decrypt(encryptionKey, val);
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
    const { getEncryptionKey } = useAccounts();
    const encryptionKey = await getEncryptionKey();
    if (encryptionKey) {
      return encrypt(encryptionKey, val);
    }
    throw new Error('Failed to write the value');
  }

  const decryptedState = ref(initialState) as Ref<T>;
  /**
   * Do not sync encryptedState with decryptedState while logged out
   * because decryptedState is reset during logout.
  */
  const isLoggedIn = ref(false);
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

    if (IS_MOBILE_APP) {
      // TODO Needs to be tested
      // Move the unencrypted value to secure storage and remove it from insecure storage
      if (restoredValue !== null) {
        decryptedState.value = restoredValue;
        WalletStorage.remove(storageKey);
      }
    }

    /**
     * Clear the state when the user logs out.
     * Ensures that the state is not leaked if an attacker removes the login modal from the DOM.
     * TODO Remove useAccounts check when the accounts is refactored
     * TODO and encryptedKey is moved to auth composable
     */
    if (!IS_MOBILE_APP && useAccounts) {
      const { encryptionKey } = useAccounts();
      watch(encryptionKey, async (key) => {
        if (!key) {
          isLoggedIn.value = false;
          decryptedState.value = null as T;
        } else {
          isLoggedIn.value = true;
          await watchUntilTruthy(() => !isUpdatingEncryptedState.value);

          // We need to update the encrypted state so that it is decrypted with the new key.
          // If decryptedState is set then it means that the password changed.
          if (decryptedState.value) {
            // Password changed, re-encrypt state
            setEncryptedState(decryptedState.value);
          } else {
            // Resumed from being inactive, decrypt state
            decryptedState.value = await getDecryptedValue(encryptedState.value);
          }
        }
      }, { immediate: true, deep: true });
    }

    /**
     * Synchronize the inner state with the decrypted state.
     */
    watch(decryptedState, async (val) => {
      options.onRestored?.(val);
      if (
        !isUpdatingEncryptedState.value
        && isLoggedIn.value
      ) {
        await setEncryptedState(val);
      }
    }, { immediate: true, deep: true });
  })();

  return [decryptedState, encryptedState];
}
