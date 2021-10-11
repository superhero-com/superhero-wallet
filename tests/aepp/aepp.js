import Vue from 'vue';
import App from './App.vue';

global.browser = require('webextension-polyfill');

new Vue({
  render: (h) => h(App),
}).$mount('#app');
