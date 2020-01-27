import Vue from 'vue';
import VueRouter from 'vue-router';
import VueClipboard from 'vue-clipboard2';
import Components from '@aeternity/aepp-components-3';
import routes from './routes';
import '@aeternity/aepp-components-3/dist/aepp.components.css';
import LoaderComponent from './components/Loader';
import TransactionItemComponent from './components/TransactionItem';
import SwitchButtonComponent from './components/SwitchButton';
import Popup from './components/Popup';
import AlertComponent from './components/Alert';
import AmountInput from './components/AmountInput';
import AddressInput from './components/AddressInput';
import { QrcodeStream, QrcodeDropZone, QrcodeCapture } from 'vue-qrcode-reader'
import ModalComponent from './components/Modal';
import * as helper from '../utils/helper';

const plugin = {
  install () {
      Vue.helpers = helper
      Vue.prototype.$helpers = helper
  }
}

Vue.use(plugin)
Vue.use(VueRouter);
Vue.use(VueClipboard);
Vue.use(Components);

Vue.component('Loader',LoaderComponent);
Vue.component('TransactionItem',TransactionItemComponent);
Vue.component('SwitchButton',SwitchButtonComponent);
Vue.component('Popup',Popup);
Vue.component('Alert', AlertComponent);
Vue.component('QrcodeStream',QrcodeStream);
Vue.component('QrcodeDropZone',QrcodeDropZone);
Vue.component('QrcodeCapture',QrcodeCapture);
Vue.component('Modal', ModalComponent);
Vue.component('AmountInput', AmountInput);
Vue.component("AddressInput", AddressInput);

let router = new VueRouter({
  routes,
});

let isFirstTransition = true;
let lastRouteKey = 'lsroute'

router.beforeEach((to, from, next) => { 
  const lastRouteName = localStorage.getItem(lastRouteKey);

  const shouldRedirect = to.path === ("/" || "/account") && lastRouteName && isFirstTransition;

  if (shouldRedirect){
    browser.storage.local.get('showAeppPopup').then(aepp => {
      browser.storage.local.get('pendingTransaction').then(pendingTx => {
        browser.storage.local.get('isLogged').then(data => {
          browser.storage.local.get('userAccount').then(async user => {
            if (user.userAccount && user.hasOwnProperty('userAccount')) {
              try {
                user.userAccount.encryptedPrivateKey = JSON.parse(user.userAccount.encryptedPrivateKey);
              } catch (e) {
                user.userAccount.encryptedPrivateKey = JSON.stringify(user.userAccount.encryptedPrivateKey);
              }
              router.app.$store.commit('UPDATE_ACCOUNT', user.userAccount);
              if (data.isLogged && data.hasOwnProperty('isLogged')) {
                browser.storage.local.get('subaccounts').then(subaccounts => {
                  let sub = [];
                  if (
                    !subaccounts.hasOwnProperty('subaccounts') ||
                    subaccounts.subaccounts == '' ||
                    (typeof subaccounts.subaccounts == 'object' && !subaccounts.subaccounts.find(f => f.publicKey == user.userAccount.publicKey))
                  ) {
                    sub.push({
                      name: typeof subaccounts.subaccounts != 'undefined' ? subaccounts.subaccounts.name : 'Main account',
                      publicKey: user.userAccount.publicKey,
                      root: true,
                      balance: 0,
                    });
                  }
                  if (subaccounts.hasOwnProperty('subaccounts') && subaccounts.subaccounts.length > 0 && subaccounts.subaccounts != '') {
                    subaccounts.subaccounts.forEach(su => {
                      sub.push({ ...su });
                    });
                  }
                  router.app.$store.dispatch('setSubAccounts', sub);
                  browser.storage.local.get('activeAccount').then(active => {
                    if (active.hasOwnProperty('activeAccount')) {
                      router.app.$store.commit('SET_ACTIVE_ACCOUNT', { publicKey: sub[active.activeAccount].publicKey, index: active.activeAccount });
                    }
                  });
                });

                // Get user networks
                browser.storage.local.get('userNetworks').then(usernetworks => {
                  if (usernetworks.hasOwnProperty('userNetworks')) {
                    usernetworks.userNetworks.forEach(data => {
                      router.app.$store.state.network[data.name] = data;
                    });
                    router.app.$store.dispatch('setUserNetworks', usernetworks.userNetworks);
                  }
                });
              }
            }
            browser.storage.local.get('confirmSeed').then(seed => {
              if (seed.hasOwnProperty('confirmSeed') && seed.confirmSeed == false) {
                router.app.$router.push('/seed');
                return;
              }
            });
            if (data.isLogged && data.hasOwnProperty('isLogged')) {
              router.app.$store.commit('SWITCH_LOGGED_IN', true);
              if(!process.env.RUNNING_IN_POPUP) {
                next(lastRouteName)
              } else {
                next('/')
              }
              
            }
          });
        });
      });
    });
  } 
  else{
    next()
  } 
  isFirstTransition = false;
})

router.afterEach(to => {
  localStorage.setItem(lastRouteKey, to.path);
});

export default router;
