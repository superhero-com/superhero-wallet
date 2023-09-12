import { onBeforeUnmount, onMounted, ref } from 'vue';
import { ROUTE_ACCOUNT } from '../popup/router/routeNames';

const homeRouteName = ref(ROUTE_ACCOUNT);
const isAppActive = ref(false);
const qrScannerOpen = ref(false);

export function useUi() {
  function setHomeRouteName(routeName: string, onChangeCallback?: () => any) {
    if (homeRouteName.value !== routeName) {
      homeRouteName.value = routeName;
      if (onChangeCallback) {
        onChangeCallback();
      }
    }
  }

  function setQrScanner(open: boolean) {
    qrScannerOpen.value = open;
  }

  function handleVisibilityChange() {
    isAppActive.value = !document.hidden;
  }

  function initVisibilityListeners() {
    handleVisibilityChange();
    onMounted(() => {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    });

    onBeforeUnmount(() => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    });
  }

  return {
    homeRouteName,
    isAppActive,
    initVisibilityListeners,
    setHomeRouteName,
    qrScannerOpen,
    setQrScanner,
  };
}
