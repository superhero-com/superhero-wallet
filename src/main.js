import Vue from 'vue';
import App from './popup/App';
import store from './store';
import router from './popup/router';

global.browser = require('webextension-polyfill');

Vue.prototype.$browser = global.browser;

/* eslint-disable no-new */
new Vue({
  el: '#app',
  store,
  router,
  render: h => h(App),
});
