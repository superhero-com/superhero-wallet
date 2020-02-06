import Vue from 'vue';
import VueRouter from 'vue-router';
import VueClipboard from 'vue-clipboard2';
import Components from '@aeternity/aepp-components-3';
import { QrcodeStream, QrcodeDropZone, QrcodeCapture } from 'vue-qrcode-reader';
import routes from './routes';
import '@aeternity/aepp-components-3/dist/aepp.components.css';
import LoaderComponent from './components/Loader';
import TransactionItemComponent from './components/TransactionItem';
import SwitchButtonComponent from './components/SwitchButton';
import Popup from './components/Popup';
import AlertComponent from './components/Alert';
import AmountInput from './components/AmountInput';
import AddressInput from './components/AddressInput';
import BackLink from './components/BackLink';
import DropDown from './components/DropDown';
import ClaimTIpButton from './components/ClaimTipButton';
import RecentTransactions from './components/RecentTransactions';
import Button from './components/Button';
import CheckBox from './components/CheckBox';
import Textarea from './components/Textarea';
import ModalComponent from './components/Modal';
import NodeConnectionStatus from './components/NodeConnectionStatus'
import Input from './components/Input';
import AmountSend from './components/AmountSend';

import * as helper from '../utils/helper';
import store from '../../store';
import wallet from '../../lib/wallet'

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
Vue.component('SwitchButton', SwitchButtonComponent);
Vue.component('Popup', Popup);
Vue.component('Alert', AlertComponent);
Vue.component('QrcodeStream', QrcodeStream);
Vue.component('QrcodeDropZone', QrcodeDropZone);
Vue.component('QrcodeCapture', QrcodeCapture);
Vue.component('Modal', ModalComponent);
Vue.component('AmountInput', AmountInput);
Vue.component('AddressInput', AddressInput);
Vue.component('BackLink', BackLink);
Vue.component('DropDown', DropDown);
Vue.component('ClaimTipButton', ClaimTIpButton);
Vue.component('RecentTransactions', RecentTransactions);
Vue.component('Button',Button);
Vue.component('CheckBox',CheckBox);
Vue.component('Textarea', Textarea);
Vue.component("NodeConnectionStatus", NodeConnectionStatus);
Vue.component('Input', Input);
Vue.component('AmountSend', AmountSend);

const router = new VueRouter({
  routes,
});

let isFirstTransition = true;
const lastRouteKey = 'lsroute';
const noRedirectUrls = ['/popup-sign-tx', '/connect', '/connect-confirm', '/sign-transaction/:type?', '/sign-transaction', '/ask-accounts','/success-tip'];

router.beforeEach((to, from, next) => {
  const lastRouteName = localStorage.getItem(lastRouteKey);
  const shouldRedirect = to.path === ("/" || "/account") && lastRouteName && isFirstTransition;
  if(store.getters.account.hasOwnProperty("publicKey") && store.getters.isLoggedIn) {
    if(!store.getters.sdk) {
      wallet.initSdk(() => next('/'))
    }
    next()
  } else {
    wallet.init((route) => {
      if(shouldRedirect && (route == '/' || route == '/account') && !noRedirectUrls.includes(lastRouteName)) {
        next(lastRouteName)
      } else {
        if(route) {
          next(route)
        } else {
          next()
        }
      }
    })
  }
  isFirstTransition = false
})

router.afterEach(to => {
  localStorage.setItem(lastRouteKey, to.path);
});

export default router;
