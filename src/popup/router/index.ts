import {
  createRouter,
  RouteRecordRaw,
  createWebHashHistory,
  createWebHistory,
} from 'vue-router';
import { Dictionary } from '@/types';
import {
  APP_LINK_WEB,
  IS_CORDOVA,
  IS_WEB,
  POPUP_TYPE,
  POPUP_TYPE_CONNECT,
  POPUP_TYPE_SIGN,
  POPUP_TYPE_MESSAGE_SIGN,
  POPUP_TYPE_RAW_SIGN,
  POPUP_TYPE_TX_SIGN,
  POPUP_TYPE_ACCOUNT_LIST,
  RUNNING_IN_POPUP,
} from '@/constants';
import { watchUntilTruthy } from '@/utils';
import { getPopupProps } from '@/utils/getPopupProps';
import store from '@/store';
import initSdk from '@/lib/wallet';
import { RouteQueryActionsController } from '@/lib/RouteQueryActionsController';
import { useAccounts, usePopupProps, useAeSdk } from '@/composables';
import { routes } from './routes';
import {
  ROUTE_ACCOUNT,
  ROUTE_INDEX,
  ROUTE_NOT_FOUND,
} from './routeNames';

const router = createRouter({
  routes: routes as RouteRecordRaw[],
  history: IS_WEB ? createWebHistory() : createWebHashHistory(),
  scrollBehavior: (to, from, savedPosition) => savedPosition || { left: 0, top: 0 },
});

const lastRouteKey = 'last-path';

const { isLoggedIn } = useAccounts({ store });
const { setPopupProps } = usePopupProps();

RouteQueryActionsController.init(router, isLoggedIn);

const unbind = router.beforeEach(async (to, from, next) => {
  await watchUntilTruthy(() => store.state.isRestored);
  next(
    (
      !RUNNING_IN_POPUP
      && to.name === ROUTE_INDEX
      && ((await browser?.storage.local.get(lastRouteKey)) as any)[lastRouteKey]
    )
    || undefined,
  );
  unbind();
});

router.beforeEach(async (to, from, next) => {
  if (!isLoggedIn.value) {
    if (to.meta?.ifNotAuthOnly || to.meta?.ifNotAuth) {
      next();
    } else {
      store.commit('setLoginTargetLocation', to);
      next({ name: ROUTE_INDEX });
    }
    return;
  }

  const { isAeSdkReady } = useAeSdk({ store });

  if (!isAeSdkReady.value && !RUNNING_IN_POPUP) {
    initSdk();
  }

  if (RUNNING_IN_POPUP && to.name !== ROUTE_NOT_FOUND) {
    const name = {
      [POPUP_TYPE_CONNECT]: 'connect',
      [POPUP_TYPE_ACCOUNT_LIST]: 'account-list',
      [POPUP_TYPE_SIGN]: 'popup-sign-tx',
      [POPUP_TYPE_RAW_SIGN]: 'popup-raw-sign',
      [POPUP_TYPE_MESSAGE_SIGN]: 'message-sign',
      [POPUP_TYPE_TX_SIGN]: 'transaction-sign',
    }[POPUP_TYPE];

    let popupProps: Dictionary = {};

    if (!Object.keys(to.params).length) {
      popupProps = await getPopupProps() as Dictionary;
      if (!popupProps?.app) {
        next({ name: ROUTE_NOT_FOUND, params: { hideHomeButton: true as any } });
        return;
      }
    }

    if (name !== to.name) {
      setPopupProps(popupProps);
      next({ name });
      return;
    }
  }

  // @ts-ignore
  next(to.meta?.ifNotAuthOnly ? { name: ROUTE_ACCOUNT } : undefined);
});

router.afterEach(async (to) => {
  if (RUNNING_IN_POPUP) return;
  if (to.meta?.notPersist) {
    await browser?.storage.local.remove(lastRouteKey);
  } else {
    await browser?.storage.local.set({ [lastRouteKey]: to.path });
  }
});

const deviceReadyPromise = new Promise((resolve) => document.addEventListener('deviceready', resolve));

const routerReadyPromise = new Promise((resolve) => {
  const unbindAfterEach = router.afterEach(() => {
    resolve(true);
    setTimeout(unbindAfterEach);
  });
});

if (IS_CORDOVA) {
  (async () => {
    await Promise.all([deviceReadyPromise, routerReadyPromise]);
    window.IonicDeeplink.onDeepLink(({ url }: any) => {
      const prefix = ['superhero:', `${APP_LINK_WEB}/`].find((p) => url.startsWith(p));
      if (!prefix) throw new Error(`Unknown url: ${url}`);
      try {
        window.location.href = `#/${url.slice(prefix.length)}`;
      } catch (error: any) {
        if (error.name !== 'NavigationDuplicated') throw error;
      }
    });

    router.afterEach((to) => {
      if (to.path === '/') {
        document.body.classList.remove('color-bg-app');
      } else {
        document.body.classList.add('color-bg-app');
      }
    });
  })();
}

export default router;
