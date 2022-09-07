import Vue from 'vue';
import VueRouter from 'vue-router';
import VueClipboard from 'vue-clipboard2';
import Components from '@aeternity/aepp-components-3';
import routes from './routes';
import '@aeternity/aepp-components-3/dist/aepp.components.css';
import LoaderComponent from './components/Loader.vue';
import { i18n } from '../../store/plugins/languages';

import * as helper from '../utils/helper';
import getPopupProps from '../utils/getPopupProps';
import store from '../../store';
import initSdk from '../../lib/wallet';
import { APP_LINK_WEB } from '../utils/constants';

const plugin = {
  install() {
    Vue.helpers = helper;
    Vue.prototype.$helpers = helper;
  },
};

Vue.use(plugin);
Vue.use(VueRouter);
Vue.use(VueClipboard);
Vue.use(Components);
Vue.component('Loader', LoaderComponent);

const router = new VueRouter({
  routes,
  mode: process.env.PLATFORM === 'web' ? 'history' : 'hash',
  scrollBehavior: (to, from, savedPosition) => savedPosition || { x: 0, y: 0 },
});

const lastRouteKey = 'last-path';

const unbind = router.beforeEach(async (to, from, next) => {
  // eslint-disable-next-line no-underscore-dangle
  await store._watcherVM.$watchUntilTruly(() => store.state.isRestored);
  next(
    (to.path === '/' && (await browser.storage.local.get(lastRouteKey))[lastRouteKey]) || undefined,
  );
  unbind();
});

let savedScrollPosition = 0;

router.beforeEach(async (to, from, next) => {
  const { isLoggedIn } = store.getters;

  if (!isLoggedIn) {
    if (to.meta.ifNotAuthOnly || to.meta.ifNotAuth) next();
    else {
      store.commit('setLoginTargetLocation', to);
      next('/');
    }
    return;
  }

  if (!store.state.sdk) initSdk();

  if (window.RUNNING_IN_POPUP) {
    const name = {
      connectConfirm: 'connect',
      sign: 'popup-sign-tx',
      rawSign: 'popup-raw-sign',
      messageSign: 'message-sign',
    }[window.POPUP_TYPE];
    if (name !== to.name) {
      next({ name, params: await getPopupProps() });
      return;
    }
  }
  if (from.fullPath === '/transactions') {
    savedScrollPosition = (process.env.IS_CORDOVA ? document.scrollingElement : document.querySelector('#app')).scrollTop;
  }

  if (to.fullPath === '/transactions' && savedScrollPosition) {
    setTimeout(() => {
      (process.env.IS_CORDOVA ? document.scrollingElement : document.querySelector('#app')).scroll(0, savedScrollPosition);
      savedScrollPosition = 0;
    }, 50);
  } else {
    (process.env.IS_CORDOVA ? document.scrollingElement : document.querySelector('#app')).scroll(0, 0);
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

if (process.env.PLATFORM === 'cordova') {
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
        router.push({ name: 'tips-send', params: { tipUrl: url } });
      } else {
        store.dispatch('modals/open', { name: 'default', ...i18n.t('modals.mobile-share-error') });
      }
    });

    router.afterEach((to) => {
      if (to.path === '/') {
        document.body.classList.remove('color-bg-3');
      } else {
        document.body.classList.add('color-bg-3');
      }
    });
  })();
}

export default router;
