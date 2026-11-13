import { Router, type RouteLocation, type RouteLocationNormalized } from 'vue-router';
import { nextTick } from 'vue';
import dayjs from 'dayjs';
import type { WalletRouteMeta } from '@/types';
import {
  IS_IOS, IS_MOBILE_APP, RUNNING_IN_POPUP, STORAGE_KEYS,
} from '@/constants';
import { handleUnknownError } from '@/utils';
import {
  ROUTE_ACCOUNT, ROUTE_ACCOUNT_DETAILS_ASSETS, ROUTE_INDEX,
} from '@/popup/router/routeNames';
import { WalletStorage } from './WalletStorage';

interface ILastRouteInfo {
  time: string;
  path: string;
}

interface IRestoration {
  path: string;
  redirect?: { path: string; from: RouteLocation };
  waitingForLogin?: boolean;
  parentPath?: string;
}

export const RouteLastUsedRoutes = (() => {
  const lastRouteKey = STORAGE_KEYS.lastRoute;

  function init(router: Router, hasTokensSupport = () => true) {
    // This feature has no value in the popups
    if (RUNNING_IN_POPUP) {
      return undefined;
    }

    let restoration: IRestoration | undefined;
    let activeNavigation: RouteLocationNormalized | undefined;
    let cancelParentMount: (() => void) | undefined;
    let unbindNavigation: (() => void) | undefined;

    function stopRestoration() {
      restoration = undefined;
      cancelParentMount?.();
      unbindNavigation?.();
    }

    // Register before auth guards so pending navigation cancels restoration.
    unbindNavigation = router.beforeEach((to) => {
      activeNavigation = to;
      cancelParentMount?.();
      if (!restoration) return;
      const { redirect, waitingForLogin, path } = restoration;
      // A matching URL alone could belong to a newer user navigation.
      if (redirect?.path === to.fullPath && redirect.from === to.redirectedFrom) {
        restoration.redirect = undefined;
      } else if (waitingForLogin && to.fullPath === path && !to.redirectedFrom) {
        restoration.waitingForLogin = false;
      } else {
        stopRestoration();
      }
    });

    function expectRedirect(to: RouteLocationNormalized, path: string) {
      if (restoration) restoration.redirect = { path, from: to.redirectedFrom || to };
      return path;
    }

    function waitForLogin(to: RouteLocationNormalized) {
      if (!restoration || to !== activeNavigation
        || (to.fullPath !== restoration.path && to.fullPath !== restoration.parentPath)) {
        return undefined;
      }
      restoration.parentPath = undefined;
      restoration.waitingForLogin = true;
      expectRedirect(to, router.resolve({ name: ROUTE_INDEX }).fullPath);
      return restoration.path;
    }

    function waitForParentPage(to: RouteLocationNormalized) {
      return new Promise<void>((resolve) => {
        let observer: MutationObserver;
        function hasMountedPage(index = 0): boolean {
          const record = to.matched[index];
          if (!record) return true;
          if (!record.components?.default) return hasMountedPage(index + 1);
          // Ionic registers route instances only after async IonPages mount.
          const element = record.instances.default?.$el as HTMLElement | undefined;
          if (!element?.classList?.contains('ion-page')) return false;
          // Offline pages can deliberately omit their nested router outlet.
          return !element.querySelector('ion-router-outlet') || hasMountedPage(index + 1);
        }
        const finish = () => {
          observer.disconnect();
          cancelParentMount = undefined;
          resolve();
        };
        const checkMounted = () => {
          if (hasMountedPage()) finish();
        };
        observer = new MutationObserver(checkMounted);
        cancelParentMount = finish;
        observer.observe(document.body, { childList: true, subtree: true });
        checkMounted();
      });
    }

    function restoreAfterAuth(to: RouteLocationNormalized) {
      const attempt = restoration;
      if (!attempt || to !== activeNavigation || to.fullPath !== attempt.path
        || attempt.parentPath || attempt.waitingForLogin) return undefined;
      const targetPath = to.path.replace(/\/$/, '');
      const parentPath = targetPath.slice(0, targetPath.lastIndexOf('/'));
      let parent = router.resolve(
        (to.meta as WalletRouteMeta).backRoute || parentPath || { name: ROUTE_ACCOUNT },
      );
      // The assets page redirects away for protocols without tokens.
      if (parent.name === ROUTE_ACCOUNT_DETAILS_ASSETS && !hasTokensSupport()) {
        parent = router.resolve({ name: (parent.meta as WalletRouteMeta).redirectIfNull });
      }
      // Skip redirecting (also unknown) and guarded parents, like seed-phrase reauthentication.
      if (parent.matched.some((record) => record.redirect || record.beforeEnter)) {
        parent = router.resolve({ name: ROUTE_ACCOUNT });
      }
      if (parent.path === to.path) {
        stopRestoration();
        return undefined;
      }

      attempt.parentPath = parent.fullPath;
      return expectRedirect(to, parent.fullPath);
    }

    const unbind = router.beforeEach((to, from, next) => {
      unbind();
      if (to.name === ROUTE_INDEX) {
        const { path, time } = WalletStorage.get<ILastRouteInfo>(lastRouteKey) || {};
        if (path && time && dayjs().isBefore(dayjs(time).add(10, 'minutes'))) {
          if (IS_MOBILE_APP && IS_IOS) {
            restoration = { path: router.resolve(path).fullPath };
            return next(expectRedirect(to, restoration.path));
          }
          stopRestoration();
          return next(path);
        }
      }
      stopRestoration();
      return next();
    });

    router.afterEach(async (to, _from, failure) => {
      const attempt = restoration;
      if (failure) {
        if (to === activeNavigation) stopRestoration();
        return;
      }
      if (attempt && to === activeNavigation) {
        if (to.fullPath === attempt.parentPath) {
          const isCurrent = () => restoration === attempt && activeNavigation === to
            && router.currentRoute.value === to;
          // Swipe-back requires a mounted parent in Ionic's stack.
          await nextTick();
          if (isCurrent()) {
            await waitForParentPage(to);
            // Let hook-triggered navigation start before restoring.
            await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
          }
          if (isCurrent()) {
            stopRestoration();
            router.push(attempt.path).catch(handleUnknownError);
          }
          // Do not overwrite the saved destination with its temporary parent.
          return;
        }
        if (!(attempt.waitingForLogin && to.name === ROUTE_INDEX)) stopRestoration();
      }
      if ((to.meta as WalletRouteMeta | undefined)?.notPersist) {
        WalletStorage.remove(lastRouteKey);
      } else {
        // Store fullPath to preserve query and hash parameters across reloads
        const routeInfo: ILastRouteInfo = { path: to.fullPath, time: dayjs().toISOString() };
        WalletStorage.set(lastRouteKey, routeInfo);
      }
    });

    return { restoreAfterAuth, waitForLogin };
  }

  return {
    init,
  };
})();
