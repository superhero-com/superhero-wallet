import { KeychainAccess, SecureStorage } from '@aparajita/capacitor-secure-storage';
import type { StorageKeysInput } from '@/types';
import { composeStorageKeys } from '@/utils';
import type { IWalletStorage } from './WalletStorage';

SecureStorage.setDefaultKeychainAccess(KeychainAccess.whenUnlockedThisDeviceOnly);

interface ISecureWalletStorage extends Omit<IWalletStorage, 'get'> {
  get: <T = Record<string, any>>(keys: StorageKeysInput) => Promise<T | null>;
}

export const SecureMobileStorage: ISecureWalletStorage = {
  set: (keys, value) => SecureStorage.setItem(composeStorageKeys(keys), JSON.stringify(value)),
  get: async (keys) => {
    const result = await SecureStorage.getItem(composeStorageKeys(keys));
    return (result ? JSON.parse(result) : null);
  },
  remove: (keys) => SecureStorage.removeItem(composeStorageKeys(keys)),
  clear: async () => SecureStorage.clear(),
};
