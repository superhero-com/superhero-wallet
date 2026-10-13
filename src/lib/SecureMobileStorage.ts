import { KeychainAccess, SecureStorage } from '@aparajita/capacitor-secure-storage';
import { Capacitor } from '@capacitor/core';
import type { StorageKeysInput } from '@/types';
import { composeStorageKeys } from '@/utils';
import type { IWalletStorage } from './WalletStorage';

SecureStorage.setDefaultKeychainAccess(KeychainAccess.whenUnlocked);

interface ISecureWalletStorage extends Omit<IWalletStorage, 'get' | 'remove' | 'clear'> {
  get: <T = Record<string, any>>(keys: StorageKeysInput) => Promise<T | null>;
  getOrCreate: <T>(keys: StorageKeysInput, value: T) => Promise<T>;
  remove: (keys: StorageKeysInput) => Promise<void>;
  clear: () => Promise<void>;
}

/** Native extension maintained in patches/@aparajita+capacitor-secure-storage+8.0.1.patch. */
const nativeStorage = SecureStorage as typeof SecureStorage & {
  internalGetOrCreateItem: (options: {
    prefixedKey: string;
    data: string;
    sync: boolean;
    access: KeychainAccess;
  }) => Promise<{ data: string }>;
};

export const SecureMobileStorage: ISecureWalletStorage = {
  set: (keys, value) => SecureStorage.setItem(composeStorageKeys(keys), JSON.stringify(value)),
  get: async (keys) => {
    const result = await SecureStorage.getItem(composeStorageKeys(keys));
    return (result ? JSON.parse(result) : null);
  },
  getOrCreate: async <T>(keys: StorageKeysInput, value: T): Promise<T> => {
    if (Capacitor.getPlatform() === 'ios') {
      // SecItemAdd is insert-only. Even a false "missing" read cannot replace a key.
      const { data } = await nativeStorage.internalGetOrCreateItem({
        prefixedKey: `${await SecureStorage.getKeyPrefix()}${composeStorageKeys(keys)}`,
        data: JSON.stringify(value),
        sync: await SecureStorage.getSynchronize(),
        access: KeychainAccess.whenUnlocked,
      });
      return JSON.parse(data);
    }
    // Android rejects failed reads; creation is serialized by mobileEncryption.
    const existing = await SecureMobileStorage.get<T>(keys);
    if (existing !== null) return existing;
    await SecureMobileStorage.set(keys, value);
    return value;
  },
  remove: (keys) => SecureStorage.removeItem(composeStorageKeys(keys)),
  clear: () => SecureStorage.clear(),
};
