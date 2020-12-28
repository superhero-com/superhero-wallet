import Vue from 'vue';
import Components from '@aeternity/aepp-components-3';
import App from './App';
import '@aeternity/aepp-components-3/dist/aepp.components.css';

global.browser = require('webextension-polyfill');

Vue.use(Components);

export default new Vue({
  el: '#app',
  render: (h) => h(App),
});
