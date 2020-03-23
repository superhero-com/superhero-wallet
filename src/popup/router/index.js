import Vue from 'vue';
import VueRouter from 'vue-router';
import VueClipboard from 'vue-clipboard2';
import Components from '@aeternity/aepp-components-3';
import routes from './routes';
import '@aeternity/aepp-components-3/dist/aepp.components.css';
import LoaderComponent from './components/Loader';
import TransactionItemComponent from './components/TransactionItem';
import Popup from './components/Popup';
import AmountInput from './components/AmountInput';
import AddressInput from './components/AddressInput';
import Button from './components/Button';
import ModalComponent from './components/Modal';

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

Vue.component('Loader', LoaderComponent);
Vue.component('TransactionItem', TransactionItemComponent);
Vue.component('Popup', Popup);
Vue.component('Modal', ModalComponent);
Vue.component('AmountInput', AmountInput);
Vue.component('AddressInput', AddressInput);
Vue.component('Button', Button);

const router = new VueRouter({
  routes,
  mode: process.env.PLATFORM === 'web' ? 'history' : 'hash',
});

const lastRouteKey = 'lsroute';

const unbind = router.beforeEach((to, from, next) => {
  next((to.path === '/' && localStorage[lastRouteKey]) || undefined);
  unbind();
});

router.beforeEach(async (to, from, next) => {
  if (store.getters.account && store.getters.isLoggedIn) {
    if (!store.getters.sdk) wallet.initSdk();
    next(to.meta.ifNotAuthOnly ? '/account' : undefined);
    return;
  }

  const { loggedIn } = await wallet.init();
  if (!loggedIn) {
    next(to.meta.ifNotAuthOnly || to.meta.ifNotAuth ? undefined : '/');
    return;
  }
  wallet.initSdk();
  if (window.RUNNING_IN_POPUP) {
    store.commit('SET_AEPP_POPUP', true);
    next(
      {
        connectConfirm: '/connect',
        sign: '/popup-sign-tx',
        askAccounts: '/ask-accounts',
        messageSign: '/message-sign',
      }[window.POPUP_TYPE]
    );
    return;
  }
  if (to.meta.ifNotAuthOnly) {
    next('/account');
    return;
  }
  next();
});

router.afterEach(to => {
  if (to.meta.notPersist) delete localStorage[lastRouteKey];
  else localStorage[lastRouteKey] = to.path;
});

if (!process.env.IS_EXTENSION) {
  document.addEventListener('deviceready', () => {
    window.IonicDeeplink.onDeepLink(async ({ url }) => {
      const prefix = ['superhero:', 'https://mobile.z52da5wt.xyz/'].find(p => url.startsWith(p));
      if (!prefix) throw new Error(`Unknown url: ${url}`);
      router.push(`/${url.slice(prefix.length)}`);
    });
  });
}

export default router;
