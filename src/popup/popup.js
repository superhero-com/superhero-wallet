import '../lib/initEnv';
import '../lib/initPolyfills';
import Vue from 'vue';
import sync from '../lib/vuexRouterSync';
import App from './App.vue';
import '../styles/fullscreen-message.scss';
import store from '../store';
import router from './router';
import { i18n } from '../store/plugins/languages';
import registerModals from './router/modals';
import Logger from '../lib/logger';
import './directives';

registerModals();
sync(store, router);
new Vue({
  store,
  router,
  i18n,
  render: (h) => h(App),
}).$mount('#app');
Logger.init();
