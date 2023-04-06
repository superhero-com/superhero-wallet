import { computed, ref } from 'vue';

let isConnectionStatusWatched = false;
const isOnline = ref(window.navigator.onLine);

export function useConnection() {
  function watchConnectionStatus() {
    if (!isConnectionStatusWatched) {
      isConnectionStatusWatched = true;
      window.addEventListener('online', () => { isOnline.value = true; });
      window.addEventListener('offline', () => { isOnline.value = false; });
    }
  }

  return {
    isOnline: computed(() => isOnline.value),
    watchConnectionStatus,
  };
}
