import { Ref, ref, watch } from 'vue';
import { validateMnemonic } from '@aeternity/bip39';

import type { StorageKey } from '@/types';
import { decrypt, encrypt } from '@/utils';
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
  options: Omit<
    ICreateStorageRefOptions<T>,
    'serializer' | 'enableSecureStorage' | 'onBackgroundSync'
  > = {},
) {
  async function getDecryptedValue(encryptedValue: any) {
    if (IS_MOBILE_APP || !encryptedValue) {
      return encryptedValue;
    }
    const { getEncryptionKey } = useAccounts();
    const encryptionKey = await getEncryptionKey();
    if (encryptionKey) {
      try {
        const decryptedValue = await decrypt(encryptionKey, encryptedValue);
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
