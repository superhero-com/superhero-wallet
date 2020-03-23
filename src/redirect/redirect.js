import Vue from 'vue';
import App from './App';

global.browser = require('webextension-polyfill');

Vue.prototype.$browser = global.browser;

export default new Vue({
  el: '#app',
  render: h => h(App),
});
