import { Router } from 'vue-router';
import dayjs from 'dayjs';
import type { WalletRouteMeta } from '@/types';
import { RUNNING_IN_POPUP, STORAGE_KEYS } from '@/constants';
import { ROUTE_INDEX } from '@/popup/router/routeNames';
import { WalletStorage } from './WalletStorage';

interface ILastRouteInfo {
  time: string;
  path: string;
}

export const RouteLastUsedRoutes = (() => {
  const lastRouteKey = STORAGE_KEYS.lastRoute;

  function init(router: Router) {
    // This feature has no value in the popups
    if (RUNNING_IN_POPUP) {
      return;
    }

    // Redirect user to previously used route if the current route is the home page
    // and we have the data about previously used route. Usable only for first 10 minutes.
    const unbind = router.beforeEach((to, from, next) => {
      unbind();
      if (to.name === ROUTE_INDEX) {
        const { path, time } = WalletStorage.get<ILastRouteInfo>(lastRouteKey) || {};
        if (path && time && dayjs().isBefore(dayjs(time).add(10, 'minutes'))) {
          return next(path);
        }
      }
      return next();
    });

    // Save the route if the page allows for this
    router.afterEach((to) => {
      if ((to.meta as WalletRouteMeta | undefined)?.notPersist) {
        WalletStorage.remove(lastRouteKey);
      } else {
        const routeInfo: ILastRouteInfo = { path: to.path, time: dayjs().toISOString() };
        WalletStorage.set(lastRouteKey, routeInfo);
      }
    });
  }

  return {
    init,
  };
})();
