import { App, URLOpenListenerEvent } from '@capacitor/app';
import {
  RouteRecordRaw,
} from 'vue-router';
import { createRouter, createWebHashHistory, createWebHistory } from '@ionic/vue-router';
import { Dictionary, WalletRouteMeta } from '@/types';
import {
  APP_LINK_WEB,
  IS_MOBILE_APP,
  IS_WEB,
  POPUP_TYPE,
  POPUP_TYPE_CONNECT,
  POPUP_TYPE_SIGN,
  POPUP_TYPE_MESSAGE_SIGN,
  POPUP_TYPE_RAW_SIGN,
  POPUP_TYPE_ACCOUNT_LIST,
  RUNNING_IN_POPUP,
  PROTOCOL_AETERNITY,
  UNFINISHED_FEATURES,
} from '@/constants';
import { watchUntilTruthy } from '@/utils';
import { getPopupProps } from '@/utils/getPopupProps';
import store from '@/store';
import initSdk from '@/lib/wallet';
import { RouteQueryActionsController } from '@/lib/RouteQueryActionsController';
import { RouteLastUsedRoutes } from '@/lib/RouteLastUsedRoutes';
import {
  useAccounts,
  usePopupProps,
  useAeSdk,
  useUi,
} from '@/composables';
import { routes } from './routes';
import {
  ROUTE_ACCOUNT,
  ROUTE_APPS_BROWSER,
  ROUTE_INDEX,
  ROUTE_NOT_FOUND,
  ROUTE_POPUP_ACCOUNT_LIST,
  ROUTE_POPUP_CONNECT,
  ROUTE_POPUP_MESSAGE_SIGN,
  ROUTE_POPUP_RAW_SIGN,
  ROUTE_POPUP_SIGN_TX,
} from './routeNames';

const router = createRouter({
  routes: routes as RouteRecordRaw[],
  history: IS_WEB ? createWebHistory() : createWebHashHistory(),
  scrollBehavior: (to, from, savedPosition) => savedPosition || { left: 0, top: 0 },
});

const {
  isLoggedIn,
  activeAccount,
  areAccountsRestored,
  setActiveAccountByGlobalIdx,
  getLastActiveProtocolAccount,
} = useAccounts();
const { setPopupProps } = usePopupProps();

const { setLoginTargetLocation } = useUi();

RouteQueryActionsController.init(router);
RouteLastUsedRoutes.init(router);

router.beforeEach(async (to, from, next) => {
  // Wait until we are sure that the user login state is correct
  await watchUntilTruthy(areAccountsRestored);

  const meta = to.meta as WalletRouteMeta;

  if (!isLoggedIn.value) {
    if (meta?.ifNotAuthOnly || meta?.ifNotAuth) {
      next();
    } else {
      setLoginTargetLocation(to);
      next({ name: ROUTE_INDEX });
    }
    return;
  }

  if (to.name === ROUTE_APPS_BROWSER) {
    // In-app browser is mobile-only
    if (!IS_MOBILE_APP && !UNFINISHED_FEATURES) {
      next({ name: ROUTE_NOT_FOUND });
      return;
    }

    // In-app browser only works with AE accounts
    if (activeAccount.value.protocol !== PROTOCOL_AETERNITY) {
      const lastActiveAeAccount = getLastActiveProtocolAccount(PROTOCOL_AETERNITY);
      setActiveAccountByGlobalIdx(lastActiveAeAccount?.globalIdx);
      next({ name: ROUTE_APPS_BROWSER });
      return;
    }
  }

  const { isAeSdkReady } = useAeSdk({ store });

  if (!isAeSdkReady.value && !RUNNING_IN_POPUP) {
    initSdk();
  }

  if (RUNNING_IN_POPUP && to.name !== ROUTE_NOT_FOUND) {
    const name = {
      [POPUP_TYPE_CONNECT]: ROUTE_POPUP_CONNECT,
      [POPUP_TYPE_ACCOUNT_LIST]: ROUTE_POPUP_ACCOUNT_LIST,
      [POPUP_TYPE_SIGN]: ROUTE_POPUP_SIGN_TX,
      [POPUP_TYPE_RAW_SIGN]: ROUTE_POPUP_RAW_SIGN,
      [POPUP_TYPE_MESSAGE_SIGN]: ROUTE_POPUP_MESSAGE_SIGN,
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
  next(meta?.ifNotAuthOnly ? { name: ROUTE_ACCOUNT } : undefined);
});

const deviceReadyPromise = new Promise((resolve) => document.addEventListener('deviceready', resolve));

const routerReadyPromise = new Promise((resolve) => {
  const unbindAfterEach = router.afterEach(() => {
    resolve(true);
    setTimeout(unbindAfterEach);
  });
});

if (IS_MOBILE_APP) {
  (async () => {
    await Promise.all([deviceReadyPromise, routerReadyPromise]);

    App.addListener('appUrlOpen', (event: URLOpenListenerEvent) => {
      const prefix = ['superhero:', `${APP_LINK_WEB}/`].find((p) => event.url.startsWith(p));
      if (!prefix) throw new Error(`Unknown url: ${event.url}`);

      try {
        const path = `/${event.url.slice(prefix?.length).split('?')[0]}`;
        const query = event.url.slice(prefix?.length).split('?')[1].split('&').reduce((acc, param) => {
          const [key, value] = param.split('=');
          return { ...acc, [key]: value };
        }, {});

        router.push({ path, query });
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
