import {
  computed,
  getCurrentInstance,
  onBeforeUnmount,
  onMounted,
  Ref,
  ref,
} from 'vue';
import { Store } from 'vuex';
import {
  excludeFalsy,
  getLocalStorageItem,
  setLocalStorageItem,
  watchUntilTruthy,
} from '@/utils';
import { INetwork } from '../types';
import { useConnection } from './connection';
import { useUi } from './ui';

/**
 * Monitor the network state and compare it with stored custom state to know when
 * user changes the network.
 */
export function createNetworkWatcher() {
  let currentNetwork: INetwork;

  return {
    onNetworkChange: async (store: Store<any>, callback: () => void) => {
      await watchUntilTruthy(() => store.state.isRestored);
      const activeNetwork = store.getters.activeNetwork as INetwork;

      if (!currentNetwork) {
        currentNetwork = activeNetwork;
      } else if (currentNetwork.name !== activeNetwork.name) {
        currentNetwork = activeNetwork;
        callback();
      }
    },
  };
}

interface ICreateStorageRefOptions<T> {
  /**
   * When set to true the state will be synced for each network separately
   * by using networkId as a postfix for the storage key.
   */
  scopedToNetwork?: boolean;
  /**
   * Callbacks run on the data that will be saved and read from the browser storage.
   */
  serializer?: {
    // eslint-disable-next-line no-unused-vars
    read: (v: T) => any,
    // eslint-disable-next-line no-unused-vars
    write: (v: T) => any,
  };
}

/**
 * Create a Vue ref with value synced in the Browser's storage
 * and scoped to active network.
 * Inspired by `useStorage`: https://vueuse.org/core/useStorage/
 */
export function createStorageRef<T = string | object | any[]>(
  initialState: T,
  keys: string | string[],
  { scopedToNetwork, serializer }: ICreateStorageRefOptions<T> = {},
) {
  let currentNetworkId: string | undefined;
  let initialStateRestored = false;
  const state = ref(initialState) as Ref<T>; // https://github.com/vuejs/core/issues/2136

  return {
    /**
     * Create computed property that acts like a Ref.
     * TODO We are passing the `store` here to avoid dependency cycle. Fix this after removing Vuex.
     */
    useStorageRef: (store?: Store<any>) => {
      if (scopedToNetwork && !store) {
        throw new Error('Argument "store" is required for the "useStorageRef" function when using scoped storage.');
      }

      const activeNetworkId = (scopedToNetwork)
        ? (store!.getters.activeNetwork as INetwork).networkId
        : undefined;
      const storageKeys: string[] = [
        ...Array.isArray(keys) ? keys : [keys],
        activeNetworkId,
      ].filter(excludeFalsy);

      function restoreStateFromStorage() {
        currentNetworkId = activeNetworkId;
        const restoredValue = getLocalStorageItem<T | null>(storageKeys);
        state.value = (restoredValue)
          ? serializer?.read(restoredValue) || restoredValue
          : initialState;
      }

      if (!initialStateRestored) {
        restoreStateFromStorage();
        initialStateRestored = true;
      }

      return computed({
        get: () => {
          if (scopedToNetwork && currentNetworkId !== activeNetworkId) {
            restoreStateFromStorage();
          }
          return state.value;
        },
        set: (val) => {
          state.value = val;
          setLocalStorageItem(storageKeys, serializer?.write(val) || val);
        },
      });
    },
  };
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
