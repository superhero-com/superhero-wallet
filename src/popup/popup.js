import Vue from 'vue';
import App from './App';
import store from '../store';
import router from './router';
import { i18n } from './utils/i18nHelper';
import initEnv from '../lib/initEnv'

global.browser = require('webextension-polyfill');
 
Vue.prototype.$browser = global.browser;

const unloadHandler = () => {
  window.props.action.deny()
  window.reject(new Error('Rejected by user'));
};


const closingWrapper = f => (...args) => {
  f(...args);
  window.removeEventListener('beforeunload', unloadHandler);
  window.close();
  setTimeout(() => {
    window.close();
  },1000)
};
if( process.env.RUNNING_IN_POPUP ) {
  window.addEventListener('beforeunload', unloadHandler);
  window.props.resolve = closingWrapper(window.props.resolve)
  window.props.reject = closingWrapper(window.props.reject)
}

/* eslint-disable no-new */
new Vue({
  el: '#app',
  store,
  router,
  i18n,
  render: h => h(App), 
});