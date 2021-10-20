import Vue from 'vue';
import App from './App.vue';

window.browser = require('webextension-polyfill');

new Vue({
  render: (h) => h(App),
}).$mount('#app');
