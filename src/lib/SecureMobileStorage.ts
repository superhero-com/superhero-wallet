import { KeychainAccess, SecureStorage } from '@aparajita/capacitor-secure-storage';
import { composeStorageKeys } from '@/utils';
import { IWalletStorage } from './WalletStorage';

SecureStorage.setDefaultKeychainAccess(KeychainAccess.whenUnlockedThisDeviceOnly);

export const SecureMobileStorage: IWalletStorage = {
  set: (keys, value) => Promise.resolve(
    SecureStorage.setItem(composeStorageKeys(keys), JSON.stringify(value)),
  ),
  // eslint-disable-next-line no-async-promise-executor
  get: (keys) => new Promise(async (resolve) => {
    const result = await SecureStorage.getItem(composeStorageKeys(keys));
    resolve(result ? JSON.parse(result) : null);
  }),
  remove: (keys) => Promise.resolve(SecureStorage.removeItem(composeStorageKeys(keys))),
  clear: async () => SecureStorage.clear(),
};
