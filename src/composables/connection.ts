import { computed, ref } from 'vue';
import { Network } from '@capacitor/network';
import { IS_MOBILE_APP } from '@/constants';

let isConnectionStatusWatched = false;
const isOnline = ref(window.navigator.onLine);

export function useConnection() {
  if (IS_MOBILE_APP && !isConnectionStatusWatched) {
    Network.getStatus().then((status) => {
      isOnline.value = status.connected;
    });
  }

  function watchConnectionStatus() {
    if (!isConnectionStatusWatched) {
      isConnectionStatusWatched = true;

      if (IS_MOBILE_APP) {
        Network.addListener('networkStatusChange', (status) => {
          isOnline.value = status.connected;
        });
      } else {
        window.addEventListener('online', () => { isOnline.value = true; });
        window.addEventListener('offline', () => { isOnline.value = false; });
      }
    }
  }

  return {
    isOnline: computed(() => isOnline.value),
    watchConnectionStatus,
  };
}
