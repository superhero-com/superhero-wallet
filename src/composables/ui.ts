import { onBeforeUnmount, onMounted, ref } from 'vue';
import { RouteLocationRaw } from 'vue-router';
import { ROUTE_ACCOUNT } from '@/popup/router/routeNames';

const homeRouteName = ref(ROUTE_ACCOUNT);
const isAppActive = ref(false);
const loginTargetLocation = ref<RouteLocationRaw>({ name: ROUTE_ACCOUNT });

export function useUi() {
  function setHomeRouteName(routeName: string, onChangeCallback?: () => any) {
    if (homeRouteName.value !== routeName) {
      homeRouteName.value = routeName;
      if (onChangeCallback) {
        onChangeCallback();
      }
    }
  }

  function setLoginTargetLocation(location: RouteLocationRaw) {
    loginTargetLocation.value = location;
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
    loginTargetLocation,
    initVisibilityListeners,
    setHomeRouteName,
    setLoginTargetLocation,
  };
}
