import { App, URLOpenListenerEvent } from '@capacitor/app';
import {
  RouteRecordRaw,
} from 'vue-router';
import { createRouter, createWebHashHistory, createWebHistory } from '@ionic/vue-router';
import { Dictionary } from '@/types';
import {
  APP_LINK_WEB,
  IS_MOBILE_APP,
  IS_WEB,
  POPUP_TYPE,
  POPUP_TYPE_CONNECT,
  POPUP_TYPE_SIGN,
  POPUP_TYPE_MESSAGE_SIGN,
  POPUP_TYPE_RAW_SIGN,
  POPUP_TYPE_TX_SIGN,
  POPUP_TYPE_ACCOUNT_LIST,
  RUNNING_IN_POPUP,
  PROTOCOL_AETERNITY,
  UNFINISHED_FEATURES,
  IS_EXTENSION,
} from '@/constants';
import { watchUntilTruthy } from '@/utils';
import { getPopupProps } from '@/utils/getPopupProps';
import store from '@/store';
import initSdk from '@/lib/wallet';
import { RouteQueryActionsController } from '@/lib/RouteQueryActionsController';
import {
  useAccounts,
  usePopupProps,
  useAeSdk,
  useUi,
} from '@/composables';
import dayjs from 'dayjs';
import { WalletStorage } from '@/lib/WalletStorage';
import { routes } from './routes';
import {
  ROUTE_ACCOUNT,
  ROUTE_APPS_BROWSER,
  ROUTE_INDEX,
  ROUTE_NOT_FOUND,
} from './routeNames';

const router = createRouter({
  routes: routes as RouteRecordRaw[],
  history: IS_WEB ? createWebHistory() : createWebHashHistory(),
  scrollBehavior: (to, from, savedPosition) => savedPosition || { left: 0, top: 0 },
});

const LAST_ROUTE_KEY = 'last-route';

const {
  isLoggedIn,
  activeAccount,
  setActiveAccountByGlobalIdx,
  getLastActiveProtocolAccount,
} = useAccounts();
const { setPopupProps } = usePopupProps();

const { setLoginTargetLocation } = useUi();

RouteQueryActionsController.init(router);

const unbind = router.beforeEach(async (to, from, next) => {
  await watchUntilTruthy(() => store.state.isRestored);

  // This check is run to avoid unnecessary fetching from WalletStorage
  if (RUNNING_IN_POPUP || to.name !== ROUTE_INDEX) {
    next(undefined);
  }

  const lastRoute = await WalletStorage.get(LAST_ROUTE_KEY);

  if (!lastRoute || (IS_EXTENSION && dayjs().isAfter(dayjs(lastRoute?.time).add(10, 'minutes')))) {
    next(undefined);
  } else {
    next(lastRoute.path);
  }

  unbind();
});

router.beforeEach(async (to, from, next) => {
  if (!isLoggedIn.value) {
    if (to.meta?.ifNotAuthOnly || to.meta?.ifNotAuth) {
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
  if (RUNNING_IN_POPUP) {
    return;
  }
  if (to.meta?.notPersist) {
    await WalletStorage.remove(LAST_ROUTE_KEY);
  } else {
    await WalletStorage.set(LAST_ROUTE_KEY, { path: to.path, time: dayjs() });
  }
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
