import { Ref, ref, watch } from 'vue';
import type { Migration, StorageKey } from '@/types';
import { asyncPipe } from '@/utils';
import { WalletStorage } from '@/lib/WalletStorage';

interface ICreateStorageRefOptions<T> {
  /**
   * Enable state synchronization between the extension and the background.
   */
  backgroundSync?: boolean;
  /**
   * Callbacks run on the data that will be saved and read from the browser storage.
   */
  serializer?: {
    read: (v: T) => any;
    write: (v: T) => any;
  };
  migrations?: Migration<T>[];
  /**
   * Allows to ensure the state is already synced with browser storage and migrated.
   */
  onRestored?: () => any;
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
    serializer,
    backgroundSync = false,
    migrations,
    onRestored,
  } = options;

  let watcherDisabled = false; // Avoid watcher going infinite loop
  const state = ref(initialState) as Ref<T>; // https://github.com/vuejs/core/issues/2136

  function setLocalState(val: T | null) {
    if (val !== null) {
      watcherDisabled = true;
      state.value = (serializer?.read) ? serializer.read(val) : val;
      setTimeout(() => { watcherDisabled = false; }, 0);
    }
  }

  function setStorageState(val: T | null) {
    WalletStorage.set(storageKey, (val && serializer?.write) ? serializer.write(val) : val);
  }

  // Restore state and run watchers
  (async () => {
    let restoredValue = await WalletStorage.get<T | null>(storageKey);
    if (migrations?.length) {
      restoredValue = await asyncPipe<T | null>(migrations)(restoredValue);
      if (restoredValue !== null) {
        setStorageState(restoredValue);
      }
    }
    onRestored?.();
    setLocalState(restoredValue);

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
      WalletStorage.watch?.(storageKey, (val) => setLocalState(val));
    }
  })();

  return state;
}
