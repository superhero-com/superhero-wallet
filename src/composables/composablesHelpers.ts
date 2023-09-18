import {
  getCurrentInstance,
  onBeforeUnmount,
  onMounted,
  Ref,
  ref,
  watch,
} from 'vue';
import { isEqual } from 'lodash-es';
import type { StorageKeysInput } from '@/types';
import { WalletStorage } from '@/lib/WalletStorage';
import { useConnection } from './connection';
import { useUi } from './ui';

interface ICreateStorageRefOptions<T> {
  /**
   * Enable state synchronization between the extension and the background.
   */
  backgroundSync?: boolean;
  /**
   * Callbacks run on the data that will be saved and read from the browser storage.
   */
  serializer?: {
    read: (v: T) => any,
    write: (v: T) => any,
  };
}

/**
 * Create a Vue ref with value synced in the Browser's storage.
 * Also allows to sync the state between the app and the extension background.
 * Inspired by `useStorage`: https://vueuse.org/core/useStorage/
 */
export function useStorageRef<T = string | object | any[]>(
  initialState: T,
  keys: StorageKeysInput,
  options: ICreateStorageRefOptions<T> = {},
) {
  const {
    serializer,
    backgroundSync = false,
  } = options;

  let isRestored = false;
  let watcherDisabled = false; // Avoid watcher going infinite loop
  const state = ref(initialState) as Ref<T>; // https://github.com/vuejs/core/issues/2136

  function setState(val: any) {
    if (val) {
      watcherDisabled = true;
      state.value = (serializer?.read) ? serializer.read(val) : val;
      setTimeout(() => { watcherDisabled = false; }, 0);
    }
  }

  watch(state, (val, oldVal) => {
    // Arrays are not compared as there is a bug which makes the new and old val always the same.
    if (!watcherDisabled && (Array.isArray(initialState) || !isEqual(val, oldVal))) {
      WalletStorage.set(keys, (serializer?.write) ? serializer.write(val) : val);
    }
  }, { deep: true });

  /**
   * Two way binding between the extension and the background
   * Whenever the app saves the state to browser storage the extension background picks this
   * and synchronizes own state with the change.
   */
  if (backgroundSync) {
    WalletStorage.watch?.(keys, (val) => setState(val));
  }

  if (!isRestored) {
    (async () => {
      const restoredValue = await WalletStorage.get<T | null>(keys);
      setState(restoredValue);
      isRestored = true;
    })();
  }

  return state;
}

/**
 * Creates a function, that will monitor how many components is actually using the composable
 * and if the value is greater than 0 it will perform a polling based on the setInterval function.
 * This function should be called before actual composable.
 */
export function createPollingBasedOnMountedComponents(interval: number) {
  const { isOnline } = useConnection();
  const { isAppActive } = useUi();

  let initialCallDone = false;
  let pollingIntervalId: NodeJS.Timer | null = null;
  let mountedComponents = 0;

  /**
   * Polling watcher - function that should be called inside a composable.
   */
  return (callback: () => void) => {
    function callbackWrapper() {
      if (isOnline.value && isAppActive.value) {
        initialCallDone = true;
        callback();
      }
    }

    if (getCurrentInstance()) {
      onMounted(() => {
        mountedComponents += 1;

        if (mountedComponents > 0 && !pollingIntervalId) {
          if (!initialCallDone) {
            callbackWrapper();
          }

          pollingIntervalId = setInterval(
            () => callbackWrapper(),
            interval,
          );
        }
      });

      onBeforeUnmount(() => {
        mountedComponents -= 1;

        if (mountedComponents === 0 && pollingIntervalId) {
          clearInterval(pollingIntervalId);
          pollingIntervalId = null;
        }
      });
    }
  };
}
