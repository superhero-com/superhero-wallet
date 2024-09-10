import { Ref, ref, watch } from 'vue';
import type { Migration, StorageKey } from '@/types';
import { WalletStorage } from '@/lib/WalletStorage';
import { asyncPipe } from '@/utils';
import { SecureMobileStorage } from '@/lib/SecureMobileStorage';
import { IS_MOBILE_APP } from '@/constants';

export interface ICreateStorageRefOptions<T> {
  /**
   * Enable secure storage for the data.
   * Mobile app only.
   */
  isSecure?: boolean;
  /**
   * Enable state synchronization between the extension and the background.
   */
  backgroundSync?: boolean;
  /**
   * Callbacks run on the data that will be saved and read from the browser storage.
   */
  serializer?: {
    read: (val: T) => any;
    write: (val: T) => any;
  };
  migrations?: Migration<T>[];
  /**
   * Allows to ensure the state is already synced with browser storage and migrated.
   */
  onRestored?: (val: T | null) => any;
  /**
   * Allows to run a callback whenever the state is synced with the background.
   */
  onBackgroundSync?: (val: T) => any;
}

/**
 * Create a Vue ref with value synced in the Browser's storage.
 * Also allows to sync the state between the app and the extension background.
 * Inspired by `useStorage`: https://vueuse.org/core/useStorage/
 */
export function useStorageRef<T = string | object | any[]>(
  initialState: T,
  storageKey: StorageKey,
  options: ICreateStorageRefOptions<T> = {},
) {
  const {
    isSecure = false,
    serializer,
    backgroundSync = false,
    migrations,
    onRestored,
    onBackgroundSync,
  } = options;

  let watcherDisabled = false; // Avoid watcher going infinite loop
  const state = ref(initialState) as Ref<T>; // https://github.com/vuejs/core/issues/2136/
  const storage = isSecure && IS_MOBILE_APP ? SecureMobileStorage : WalletStorage;

  async function setLocalState(val: T | null) {
    if (val !== null) {
      watcherDisabled = true;
      state.value = (serializer?.read) ? await serializer.read(val) : val;
      setTimeout(() => { watcherDisabled = false; }, 0);
    }
  }

  async function setStorageState(val: T | null) {
    storage.set(storageKey, (val && serializer?.write) ? await serializer.write(val) : val);
  }

  // Restore state and run watchers
  (async () => {
    let restoredValue = storage.get<T | null>(storageKey);
    if (migrations?.length) {
      restoredValue = await asyncPipe<T | null>(migrations)(restoredValue!);
      if (restoredValue !== null) {
        await setStorageState(restoredValue);
      }
    }
    onRestored?.(restoredValue);
    await setLocalState(restoredValue);

    /**
     * Synchronize the state value with the storage.
     */
    watch(state, (val) => {
      if (!watcherDisabled) {
        setStorageState(val);
      }
    }, { deep: true });

    /**
     * Two way binding between the extension and the background
     * Whenever the app saves the state to browser storage the extension background
     * and the offscreen tab pick this and synchronize their own state with the change.
     */
    if (backgroundSync) {
      storage.watch?.(storageKey, (val) => {
        setLocalState(val);
        onBackgroundSync?.(val);
      });
    }
  })();

  return state;
}
