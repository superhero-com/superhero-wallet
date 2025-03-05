import {
  getCurrentInstance,
  onBeforeUnmount,
  onMounted,
} from 'vue';
import { useConnection } from './connection';
import { useUi } from './ui';

/**
 * Creates a function, that will monitor how many components is actually using the composable
 * and if the value is greater than 0 it will perform a polling based on the setInterval function.
 * This function should be called before actual composable.
 */
export function createPollingBasedOnMountedComponents(interval: number) {
  const { isOnline } = useConnection();
  const { isAppActive } = useUi();

  let initialCallDone = false;
  let pollingIntervalId: NodeJS.Timeout | null = null;
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
