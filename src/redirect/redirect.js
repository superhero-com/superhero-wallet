import Vue from 'vue';
import App from './App';

global.browser = require('webextension-polyfill');

Vue.prototype.$browser = global.browser;
new Vue({
  el: '#app',
  render: h => h(App),
});
