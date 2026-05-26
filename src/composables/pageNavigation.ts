import { useIonRouter } from '@ionic/vue';
import { computed } from 'vue';
import { useRoute } from 'vue-router';

import { ROUTE_INDEX } from '@/popup/router/routeNames';
import { useAccounts } from './accounts';
import { useUi } from './ui';

export function usePageNavigation() {
  const route = useRoute();
  const ionRouter = useIonRouter();

  const { homeRouteName } = useUi();
  const { isLoggedIn } = useAccounts();

  const currentHomeRouteName = computed(
    () => isLoggedIn.value
      ? homeRouteName.value
      : ROUTE_INDEX,
  );

  function navigateBack() {
    const { fullPath, meta } = route;
    const { backRoute } = meta || {};

    if (!isLoggedIn.value) {
      return ionRouter.navigate({ name: currentHomeRouteName.value }, 'back', 'push');
    }

    if (backRoute) {
      // TODO: rewrite back button logic in more unified way
      return ionRouter.navigate(backRoute, 'back', 'push');
    }

    const path = fullPath.endsWith('/') ? fullPath.slice(0, -1) : fullPath;
    const parentPath = path.slice(0, path.lastIndexOf('/'));

    return ionRouter.navigate(
      parentPath || { name: currentHomeRouteName.value },
      'back',
      'push',
    );
  }

  function navigateHome() {
    return ionRouter.navigate({ name: currentHomeRouteName.value }, 'back', 'push');
  }

  return {
    homeRouteName,
    isLoggedIn,
    navigateBack,
    navigateHome,
  };
}
