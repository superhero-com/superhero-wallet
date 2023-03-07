import { Browser } from 'webextension-polyfill';
import { IS_EXTENSION, RUNNING_IN_TESTS } from '../../lib/environment';
import { LOCAL_STORAGE_PREFIX } from './constants';

type WalletStorageKeys = string | string[];

/* eslint-disable no-unused-vars */
interface IWalletStorage {
  set: (keys: WalletStorageKeys, value: any) => Promise<void>;
  get: <T = Record<string, any>>(keys: WalletStorageKeys) => Promise<T | null>;
  remove: (keys: WalletStorageKeys) => Promise<void>;
}
/* eslint-enable no-unused-vars */

/**
 * Prefix all the storage keys and build the key string.
 */
const composeKeys = (keys: WalletStorageKeys) => [
  LOCAL_STORAGE_PREFIX,
  ...Array.isArray(keys) ? keys : [keys],
].join('_');

/**
 * Extension Storage
 * https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/storage
 */
function createBrowserStorageInterface(): IWalletStorage {
  const browserStorage = (browser as Browser).storage.local;
  return {
    set: (keys, value) => browserStorage.set({ [composeKeys(keys)]: value }),
    get: async (keys) => {
      const key = composeKeys(keys);
      const result = await browserStorage.get(key);
      return result[key];
    },
    remove: (keys) => browserStorage.remove(keys),
  };
}

/**
 * Default web browser Storage
 */
function createLocalStorageInterface(): IWalletStorage {
  return {
    set: (keys, value) => new Promise(
      (resolve) => resolve(localStorage.setItem(composeKeys(keys), JSON.stringify(value))),
    ),
    get: (keys) => new Promise((resolve) => {
      const result = localStorage.getItem(composeKeys(keys));
      resolve(result ? JSON.parse(result) : null);
    }),
    remove: (keys) => new Promise((resolve) => resolve(localStorage.removeItem(composeKeys(keys)))),
  };
}

/**
 * Common interface to store the app data on user's device.
 */
export const walletStorage: IWalletStorage = ((IS_EXTENSION || RUNNING_IN_TESTS) && browser)
  ? createBrowserStorageInterface()
  : createLocalStorageInterface();
