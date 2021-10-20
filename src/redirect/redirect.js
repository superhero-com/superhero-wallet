import Vue from 'vue';
import App from './App.vue';
import { i18n } from '../store/plugins/languages';

window.browser = require('webextension-polyfill');

export default new Vue({
  el: '#app',
  i18n,
  render: (h) => h(App),
});
