import { Ref, ref, watch } from 'vue';
import { validateMnemonic } from '@aeternity/bip39';

import type { StorageKey } from '@/types';
import { decrypt, encrypt } from '@/utils';
import { IS_MOBILE_APP, STORAGE_KEYS } from '@/constants';
import { WalletStorage } from '@/lib/WalletStorage';
import { useAccounts } from './accounts';
import { type ICreateStorageRefOptions, useStorageRef } from './storageRef';

interface ICreateSecureStorageRefOptions<T> extends
    Omit<ICreateStorageRefOptions<T>, 'serializer' | 'enableSecureStorage' | 'onBackgroundSync'> {
  encryptionDisabled?: boolean;
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
  options: ICreateSecureStorageRefOptions<T> = {
    encryptionDisabled: IS_MOBILE_APP,
  },
) {
  /**
   * Checks if the value needs to be decrypted and decrypts it using the encryption key.
   * On mobile, the value is already decrypted by the storageRef composable.
   */
  async function getDecryptedValue(val: any): Promise<T> {
    if (options.encryptionDisabled || !val) {
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
  async function getEncryptedValue(val: any): Promise<T> {
    if (options.encryptionDisabled || !val) {
      return val;
    }
    const { getEncryptionKey } = useAccounts();
    const encryptionKey = await getEncryptionKey();
    if (encryptionKey) {
      return encrypt(encryptionKey, val) as T;
    }
    throw new Error('Failed to write the value');
  }

  const decryptedState = ref(initialState) as Ref<T>;

  /** Should always hold encrypted values (both on storage and state) */
  const encryptedState = useStorageRef<T>(null as T, storageKey, {
    ...options,
    enableSecureStorage: true,
    // Handle write operation within the composable but read from storageRef
    serializer: {
      read: getDecryptedValue,
      write: (val) => val,
    },
    onRestored: async (val: T) => {
      if (val) {
        const decryptedValue = await getDecryptedValue(val);
        decryptedState.value = decryptedValue;
        options.onRestored?.(decryptedValue);
      }
    },
    onBackgroundSync: async (val: T) => {
      decryptedState.value = await getDecryptedValue(val);
    },
  });

  /**
   * This is an exception for the mnemonic because it's a key part of the password feature.
   * It restores the mnemonic from the insecure storage and sets it on the accounts composable.
   */
  async function setMnemonicOnAccounts(mnemonic: T) {
    if (mnemonic && validateMnemonic(mnemonic)) {
      const { setMnemonicAndInitializePassword } = useAccounts();
      await setMnemonicAndInitializePassword(mnemonic as string, true);
      options.onRestored?.(mnemonic);
    }
  }

  // Restore state and run watchers
  (async () => {
    // Check if value exists in insecure storage and migrate it to secure storage
    const decryptedValue = WalletStorage.get<T | null>(storageKey);
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
     * Ensures that the state is not leaked if an attacker removes the login modal from the DOM.
     * TODO Remove useAccounts check when the accounts is refactored
     * TODO and encryptedKey is moved to auth composable
     */
    if (!IS_MOBILE_APP && useAccounts) {
      const { encryptionKey } = useAccounts();
      watch(encryptionKey, async (key) => {
        if (!key) {
          decryptedState.value = initialState;
        } else {
          decryptedState.value = await getDecryptedValue(encryptedState.value);
        }
      }, { immediate: true, deep: true });
    }

    /**
     * Synchronize the inner state with the decrypted state.
     */
    watch(decryptedState, async (val) => {
      options.onRestored?.(val);
      // Do not write null values to the mnemonic storage
      if (val || (storageKey !== STORAGE_KEYS.mnemonic)) {
        encryptedState.value = await getEncryptedValue(val);
      }
    }, { immediate: true, deep: true });
  })();

  return [encryptedState, decryptedState];
}
