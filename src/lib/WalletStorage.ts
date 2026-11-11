import { isEqual } from 'lodash-es';
import type { StorageKeysInput } from '@/types';
import { IS_MOBILE_APP, IS_OFFSCREEN_TAB } from '@/constants';
import { composeStorageKeys } from '@/utils';
import { clearVault, isVaultKey, readVault } from './WalletVault';

export interface IWalletStorage {
  set: (keys: StorageKeysInput, value: any) => void;
  get: <T = Record<string, any>>(keys: StorageKeysInput) => T | null;
  remove: (keys: StorageKeysInput) => void;
  watch?: (keys: StorageKeysInput, callback: (val: any) => void) => void;
  clear: () => void | Promise<void>;
}

/**
 * Common interface to store the app data on user's device.
 * Exposes methods that allows to manipulate or watch the device storage.
 * Allows also to synchronize the state between the app and the extension background.
 */
export const WalletStorage: IWalletStorage = {
  set: (keys, value) => {
    const key = Array.isArray(keys) && keys.length === 1 ? keys[0] : keys;
    if (typeof key === 'string' && isVaultKey(key) && readVault().revision !== null) {
      if (readVault().values[key] === value) return;
      throw new Error('Wallet secrets must be saved through the vault');
    }
    localStorage.setItem(composeStorageKeys(keys), JSON.stringify(value));
  },
  get: (keys) => {
    const key = Array.isArray(keys) && keys.length === 1 ? keys[0] : keys;
    if (typeof key === 'string' && isVaultKey(key)) {
      return readVault().values[key] as any;
    }
    const result = localStorage.getItem(composeStorageKeys(keys));
    return result ? JSON.parse(result) : null;
  },
  remove: (keys) => {
    const key = Array.isArray(keys) && keys.length === 1 ? keys[0] : keys;
    if (typeof key === 'string' && isVaultKey(key)
      && readVault().revision !== null && readVault().values[key] !== null) {
      throw new Error('Wallet secrets must be removed through the vault');
    }
    localStorage.removeItem(composeStorageKeys(keys));
  },
  /**
   * Sync state between the app and the offscreen tab. `watch` should not be
   * called in the app. Only in the offscreen tab.
   */
  watch: (keys, callback) => {
    if (!IS_OFFSCREEN_TAB) {
      return;
    }
    window.addEventListener('storage', (event) => {
      if (composeStorageKeys(keys).includes(event.key!)) {
        if (event && !isEqual(event.newValue, event.oldValue)) {
          callback(JSON.parse(event.newValue!));
        }
      }
    });
  },
  clear: async () => {
    if (!IS_MOBILE_APP) await clearVault();
    localStorage.clear();
  },
};
