import { computed, ref } from '@vue/composition-api';

export function useConnection() {
  const isOnline = ref(window.navigator.onLine);

  /**
   * Establish
   */
  function watchConnectionStatus() {
    window.addEventListener('online', () => { isOnline.value = true; });
    window.addEventListener('offline', () => { isOnline.value = false; });
  }

  return {
    isOnline: computed(() => isOnline.value),
    watchConnectionStatus,
  };
}
