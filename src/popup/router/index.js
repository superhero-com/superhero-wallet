import Vue from 'vue';
import VueRouter from 'vue-router';
import VueClipboard from 'vue-clipboard2';
import Components from '@aeternity/aepp-components-3';
import VueTour from 'vue-tour';
import 'vue-tour/dist/vue-tour.css';
import routes from './routes';
import '@aeternity/aepp-components-3/dist/aepp.components.css';
import LoaderComponent from './components/Loader';

import * as helper from '../utils/helper';
import store from '../../store';
import wallet from '../../lib/wallet';

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
Vue.use(VueTour);
Vue.component('Loader', LoaderComponent);

const router = new VueRouter({
  routes,
  mode: process.env.PLATFORM === 'web' ? 'history' : 'hash',
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

router.beforeEach(async (to, from, next) => {
  if (store.state.isLoggedIn) {
    if (!store.state.sdk) wallet.initSdk();
    next(to.meta.ifNotAuthOnly ? '/account' : undefined);
    return;
  }

  const { loggedIn } = await wallet.init();
  if (!loggedIn) {
    if (to.meta.ifNotAuthOnly || to.meta.ifNotAuth) next();
    else {
      store.commit('setLoginTargetLocation', to);
      next('/');
    }
    return;
  }
  wallet.initSdk();

  if (window.RUNNING_IN_POPUP) {
    next(
      {
        connectConfirm: '/connect',
        sign: '/popup-sign-tx',
        askAccounts: '/ask-accounts',
        messageSign: '/message-sign',
      }[window.POPUP_TYPE],
    );
    return;
  }
  if (to.meta.ifNotAuthOnly) {
    next('/account');
    return;
  }
  next();
});

router.afterEach(async (to) => {
  if (to.meta.notPersist) await browser.storage.local.remove(lastRouteKey);
  else await browser.storage.local.set({ [lastRouteKey]: to.path });
});

const deviceReadyPromise = new Promise((resolve) =>
  document.addEventListener('deviceready', resolve),
);

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
      const prefix = ['superhero:', 'https://wallet.superhero.com/'].find((p) => url.startsWith(p));
      if (!prefix) throw new Error(`Unknown url: ${url}`);
      try {
        window.location = `#/${url.slice(prefix.length)}`;
      } catch (error) {
        if (error.name !== 'NavigationDuplicated') throw error;
      }
    });
  })();
}

export default router;
