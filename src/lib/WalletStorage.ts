import { isEqual } from 'lodash-es';
import type { StorageKeysInput } from '@/types';
import {
  IS_EXTENSION_BACKGROUND,
  IS_OFFSCREEN_TAB,
  RUNNING_IN_TESTS,
} from '@/constants';
import { composeStorageKeys } from '@/utils';

export interface IWalletStorage {
  set: (keys: StorageKeysInput, value: any) => Promise<void>;
  get: <T = Record<string, any>>(keys: StorageKeysInput) => Promise<T | null>;
  remove: (keys: StorageKeysInput) => Promise<void>;
  watch?: (keys: StorageKeysInput, callback: (val: any) => void) => void;
  clear: () => Promise<void>;
}

/**
 * Extension Background Script Storage
 * https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/storage
 */
function createBrowserStorageInterface(): IWalletStorage {
  const browserStorage = browser.storage.local;
  return {
    set: (keys, value) => browserStorage.set({ [composeStorageKeys(keys)]: JSON.stringify(value) }),
    get: async (keys) => {
      const key = composeStorageKeys(keys);
      const result = (await browserStorage.get(key) as any)[key];
      return (result) ? JSON.parse(result) : null;
    },
    remove: (keys) => browserStorage.remove(keys),
    watch: (keys, callback) => {
      browser?.storage?.onChanged?.addListener((changes) => {
        const change = changes[composeStorageKeys(keys)];
        if (change && !isEqual(change.newValue, change.oldValue)) {
          callback(JSON.parse(change.newValue));
        }
      });
    },
    clear: () => browserStorage.clear(),
  };
}

/**
 * Default web browser Storage.
 * Also used by the offscreen tab
 */
function createLocalStorageInterface(): IWalletStorage {
  return {
    set: (keys, value) => new Promise(
      (resolve) => resolve(localStorage.setItem(composeStorageKeys(keys), JSON.stringify(value))),
    ),
    get: (keys) => new Promise((resolve) => {
      const result = localStorage.getItem(composeStorageKeys(keys));
      resolve(result ? JSON.parse(result) : null);
    }),
    remove: (keys) => new Promise(
      (resolve) => resolve(localStorage.removeItem(composeStorageKeys(keys))),
    ),
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
    clear: async () => localStorage.clear(),
  };
}

/**
 * Common interface to store the app data on user's device.
 * Exposes methods that allows to manipulate or watch the device storage.
 * Allows also to synchronize the state between the app and the extension background.
 */
export const WalletStorage: IWalletStorage = (
  !RUNNING_IN_TESTS
  && !IS_OFFSCREEN_TAB
  && IS_EXTENSION_BACKGROUND
  && browser
)
  ? createBrowserStorageInterface()
  : createLocalStorageInterface();
