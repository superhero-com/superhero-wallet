import Vue from 'vue';
import VueRouter from 'vue-router';
import { Dictionary, ICordova } from '../../types';
import {
  ROUTE_ACCOUNT,
  ROUTE_INDEX,
} from './routeNames';
import { routes } from './routes';
import { i18n } from '../../store/plugins/languages';
import getPopupProps from '../utils/getPopupProps';
import store from '../../store';
import initSdk from '../../lib/wallet';
import {
  APP_LINK_WEB,
  POPUP_TYPE_CONNECT,
  POPUP_TYPE_SIGN,
  POPUP_TYPE_MESSAGE_SIGN,
  POPUP_TYPE_RAW_SIGN,
  watchUntilTruthy,
} from '../utils';
import {
  RUNNING_IN_POPUP,
  POPUP_TYPE,
  IS_CORDOVA,
  IS_WEB,
} from '../../lib/environment';
import { useAccounts, useModals } from '../../composables';

Vue.use(VueRouter);

const router = new VueRouter({
  routes,
  mode: IS_WEB ? 'history' : 'hash',
  scrollBehavior: (to, from, savedPosition) => savedPosition || { x: 0, y: 0 },
});

const lastRouteKey = 'last-path';

const { isLoggedIn } = useAccounts({ store });

const unbind = router.beforeEach(async (to, from, next) => {
  await watchUntilTruthy(() => store.state.isRestored);
  next(
    (to.name === ROUTE_INDEX && (await browser?.storage.local.get(lastRouteKey))[lastRouteKey])
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

  if (!store.getters['sdkPlugin/sdk']) initSdk();

  if (RUNNING_IN_POPUP) {
    const name = {
      [POPUP_TYPE_CONNECT]: 'connect',
      [POPUP_TYPE_SIGN]: 'popup-sign-tx',
      [POPUP_TYPE_RAW_SIGN]: 'popup-raw-sign',
      [POPUP_TYPE_MESSAGE_SIGN]: 'message-sign',
    }[POPUP_TYPE];

    if (name !== to.name) {
      next({ name, params: await getPopupProps() as Dictionary });
      return;
    }
  }
  // TODO: rethink this approach
  // @ts-ignore
  document.querySelector('.app-inner').scroll(0, 0);

  next(to.meta?.ifNotAuthOnly ? { name: ROUTE_ACCOUNT } : undefined);
});

router.afterEach(async (to) => {
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
    const { openDefaultModal } = useModals();
    const cordova = window.cordova as ICordova;
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

    cordova.openwith.init();
    cordova.openwith.addHandler((intent: any) => {
      const url = intent.items.find(({ type }: any) => type.includes('url'))?.data;
      if (url) {
        router.push({ name: ROUTE_ACCOUNT, query: { url } });
      } else {
        openDefaultModal({
          title: i18n.t('modals.mobile-share-error.title'),
          msg: i18n.t('modals.mobile-share-error.msg'),
        });
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
