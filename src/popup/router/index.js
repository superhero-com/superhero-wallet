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
import { noRedirectRoutes } from '../utils/config';

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

let isFirstTransition = true;
const lastRouteKey = 'lsroute';

const noAuthUrls = ['/', '/importAccount', '/termsOfService', '/intro'];

router.beforeEach((to, from, next) => {
  const lastRouteName = localStorage.getItem(lastRouteKey);
  const shouldRedirect = to.path === ('/' || '/account') && lastRouteName && isFirstTransition;

  if (store.getters.account && store.getters.isLoggedIn) {
    if (!store.getters.sdk) {
      wallet.initSdk(() => next('/'));
    }
    if (noAuthUrls.includes(to.path) && to.path !== '/termsOfService') {
      next('/account');
    } else {
      next();
    }
  } else {
    wallet.init(route => {
      if (shouldRedirect && (route === '/' || route === '/account') && !noRedirectRoutes.includes(lastRouteName) && lastRouteName.indexOf('/sign-transaction') === -1) {
        next(lastRouteName);
      } else if (route) {
        next(route);
      } else if (!noAuthUrls.includes(to.path)) {
        next('/');
      } else {
        next();
      }
    });
  }
  isFirstTransition = false;
});

router.afterEach(to => {
  localStorage.setItem(lastRouteKey, to.path);
});

if (!process.env.IS_EXTENSION) {
  document.addEventListener('deviceready', () => {
    window.IonicDeeplink.onDeepLink(async ({ url }) => {
      if (!store.getters.isLoggedIn) {
        await Promise(resolve => {
          const unsubscribe = store.watch(
            (state, { isLoggedIn }) => isLoggedIn,
            isLoggedIn => {
              if (!isLoggedIn) return;
              unsubscribe();
              resolve();
            }
          );
        });
      }
      const prefix = ['superhero:', 'https://mobile.z52da5wt.xyz/'].find(p => url.startsWith(p));
      if (!prefix) throw new Error(`Unknown url: ${url}`);
      router.push(`/${url.slice(prefix.length)}`);
    });
  });
}

export default router;
