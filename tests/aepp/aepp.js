import Vue from 'vue';
import App from './App';

global.browser = require('webextension-polyfill');

new Vue({
  render: (h) => h(App),
}).$mount('#app');
