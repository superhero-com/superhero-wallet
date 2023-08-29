import {
  getCurrentInstance,
  onBeforeUnmount,
  onMounted,
  Ref,
  ref,
  watch,
} from 'vue';
import { excludeFalsy } from '@/utils';
import { WalletStorage } from '@/lib/WalletStorage';
import { useConnection } from './connection';
import { useUi } from './ui';

interface ICreateStorageRefOptions<T> {
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
  keys: string | string[],
  { serializer }: ICreateStorageRefOptions<T> = {},
) {
  let isRestored = false;
  const state = ref(initialState) as Ref<T>; // https://github.com/vuejs/core/issues/2136
  const storageKeys: string[] = [...Array.isArray(keys) ? keys : [keys]].filter(excludeFalsy);

  watch(state, (val) => {
    WalletStorage.set(storageKeys, serializer?.write(val) || val);
  }, { deep: true });

  /**
   * Whenever the app saves the state to browser storage the extension background picks this
   * and synchronizes own state with the change.
   */
  WalletStorage.watch?.(keys, (val) => {
    state.value = serializer?.read?.(val) || val;
  });

  if (!isRestored) {
    (async () => {
      const restoredValue = await WalletStorage.get<T | null>(storageKeys);
      state.value = (restoredValue)
        ? serializer?.read?.(restoredValue) || restoredValue
        : initialState;
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
