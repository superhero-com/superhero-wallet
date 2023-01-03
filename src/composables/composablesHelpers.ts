import {
  onBeforeUnmount,
  onMounted,
  ref,
  getCurrentInstance,
} from '@vue/composition-api';
import { executeAndSetInterval } from '../popup/utils';

/**
 * Creates a function, that will monitor how many components is actually using the composable
 * and if the value is greater than 0 it will perform a polling based on the setInterval function.
 * This function should be called before actual composable.
 */
export function createPollingBasedOnMountedComponents() {
  let pollingIntervalId: NodeJS.Timer | null = null;
  const mountedComponents = ref(0);

  /**
   * Polling watcher - function that should be called inside of an composable.
   */
  return (callback: () => void, interval: number) => {
    if (getCurrentInstance()) {
      onMounted(() => {
        mountedComponents.value += 1;

        if (mountedComponents.value > 0 && !pollingIntervalId) {
          pollingIntervalId = executeAndSetInterval(() => callback(), interval);
        }
      });

      onBeforeUnmount(() => {
        mountedComponents.value -= 1;

        if (mountedComponents.value === 0 && pollingIntervalId) {
          clearInterval(pollingIntervalId);
          pollingIntervalId = null;
        }
      });
    }
  };
}
