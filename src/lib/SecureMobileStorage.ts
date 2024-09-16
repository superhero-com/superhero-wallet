import { KeychainAccess, SecureStorage } from '@aparajita/capacitor-secure-storage';
import { composeStorageKeys } from '@/utils';
import { IWalletStorage } from './WalletStorage';

SecureStorage.setDefaultKeychainAccess(KeychainAccess.whenUnlocked);

export const SecureMobileStorage: IWalletStorage = {
  set: (keys, value) => Promise.resolve(
    SecureStorage.setItem(composeStorageKeys(keys), JSON.stringify(value)),
  ),
  async get(keys) {
    const result = await SecureStorage.getItem(composeStorageKeys(keys));
    return result ? JSON.parse(result) : null;
  },
  remove: (keys) => Promise.resolve(SecureStorage.removeItem(composeStorageKeys(keys))),
  clear: async () => SecureStorage.clear(),
};
