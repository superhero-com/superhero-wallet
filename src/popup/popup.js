import Vue from 'vue';
import App from './App';
import store from '../store';
import router from './router';
import { i18n } from './utils/i18nHelper';

global.browser = require('webextension-polyfill');
 
Vue.prototype.$browser = global.browser;

/* eslint-disable no-new */
new Vue({
  el: '#app',
  store,
  router,
  i18n,
  render: h => h(App), 
});