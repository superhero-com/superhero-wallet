import '../lib/environment';
import '../lib/initPolyfills';
import Vue from 'vue';
import sync from '../lib/vuexRouterSync';
import './plugins/compositionApi';
import './plugins/vueClipboard';
import './plugins/aeppComponents';
import store from '../store';
import router from './router';
import { i18n } from '../store/plugins/languages';
import registerModals from './router/modals';
import Logger from '../lib/logger';
import App from './App.vue';
import LoaderComponent from './components/Loader.vue';

import '../styles/fullscreen-message.scss';

Vue.component('Loader', LoaderComponent);

registerModals();
sync(store, router);
new Vue({
  store,
  router,
  i18n,
  render: (h) => h(App),
}).$mount('#app');
Logger.init();
