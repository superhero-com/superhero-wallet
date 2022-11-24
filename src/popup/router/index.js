import Vue from 'vue';
import VueRouter from 'vue-router';
import routes from './routes';
import { i18n } from '../../store/plugins/languages';
import getPopupProps from '../utils/getPopupProps';
import store from '../../store';
import { initSdk } from '../../lib/wallet';
import {
  APP_LINK_WEB,
  POPUP_TYPE_CONNECT,
  POPUP_TYPE_SIGN,
  POPUP_TYPE_MESSAGE_SIGN,
  POPUP_TYPE_RAW_SIGN,
  MODAL_DEFAULT,
  watchUntilTruthy,
} from '../utils';
import {
  RUNNING_IN_POPUP,
  POPUP_TYPE,
  IS_CORDOVA,
  IS_WEB,
} from '../../lib/environment';
import { useMiddleware } from '../../composables';

Vue.use(VueRouter);

const router = new VueRouter({
  routes,
  mode: IS_WEB ? 'history' : 'hash',
  scrollBehavior: (to, from, savedPosition) => savedPosition || { x: 0, y: 0 },
});

const lastRouteKey = 'last-path';

const unbind = router.beforeEach(async (to, from, next) => {
  await watchUntilTruthy(() => store.state.isRestored);
  next(
    (to.path === '/' && (await browser.storage.local.get(lastRouteKey))[lastRouteKey]) || undefined,
  );
  unbind();
});

let savedScrollPosition = 0;
const { initMiddleware, isMiddlewareReady } = useMiddleware(store);

router.beforeEach(async (to, from, next) => {
  const { isLoggedIn } = store.getters;

  if (!isLoggedIn) {
    if (to.meta.ifNotAuthOnly || to.meta.ifNotAuth) {
      next();
    } else {
      store.commit('setLoginTargetLocation', to);
      next('/');
    }
    return;
  }

  // TODO: Initializing SDK & Middleware should be lazy and performed in the getter
  if (!store.getters['sdkPlugin/sdk']) {
    initSdk(store);
  }
  if (!isMiddlewareReady.value) {
    initMiddleware();
  }

  if (RUNNING_IN_POPUP) {
    const name = {
      [POPUP_TYPE_CONNECT]: 'connect',
      [POPUP_TYPE_SIGN]: 'popup-sign-tx',
      [POPUP_TYPE_RAW_SIGN]: 'popup-raw-sign',
      [POPUP_TYPE_MESSAGE_SIGN]: 'message-sign',
    }[POPUP_TYPE];

    if (name !== to.name) {
      next({ name, params: await getPopupProps() });
      return;
    }
  }

  const scrollingElement = (IS_CORDOVA)
    ? document.scrollingElement
    : document.querySelector('.app-inner');

  if (from.fullPath === '/transactions') {
    savedScrollPosition = scrollingElement.scrollTop;
  }
  if (to.fullPath === '/transactions' && savedScrollPosition) {
    setTimeout(() => {
      scrollingElement.scroll(0, savedScrollPosition);
      savedScrollPosition = 0;
    }, 50);
  } else {
    scrollingElement.scroll(0, 0);
  }

  next(to.meta.ifNotAuthOnly ? '/account' : undefined);
});

router.afterEach(async (to) => {
  if (to.meta.notPersist) await browser.storage.local.remove(lastRouteKey);
  else await browser.storage.local.set({ [lastRouteKey]: to.path });
});

const deviceReadyPromise = new Promise((resolve) => document.addEventListener('deviceready', resolve));

const routerReadyPromise = new Promise((resolve) => {
  const unbindAfterEach = router.afterEach(() => {
    resolve();
    setTimeout(unbindAfterEach);
  });
});

if (IS_CORDOVA) {
  (async () => {
    await Promise.all([deviceReadyPromise, routerReadyPromise]);
    window.IonicDeeplink.onDeepLink(({ url }) => {
      const prefix = ['superhero:', `${APP_LINK_WEB}/`].find((p) => url.startsWith(p));
      if (!prefix) throw new Error(`Unknown url: ${url}`);
      try {
        window.location = `#/${url.slice(prefix.length)}`;
      } catch (error) {
        if (error.name !== 'NavigationDuplicated') throw error;
      }
    });

    window.cordova.openwith.init();
    window.cordova.openwith.addHandler((intent) => {
      const url = intent.items.find(({ type }) => type.includes('url'))?.data;
      if (url) {
        router.push({ name: 'account', query: { url } });
      } else {
        store.dispatch('modals/open', { name: MODAL_DEFAULT, ...i18n.t('modals.mobile-share-error') });
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
