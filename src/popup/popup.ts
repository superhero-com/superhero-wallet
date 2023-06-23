import '../lib/environment';
import '../lib/initPolyfills';
import Vue from 'vue';
import './plugins/compositionApi';
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

new Vue({
  store,
  router,
  i18n,
  render: (h) => h(App),
}).$mount('#app');

Logger.init();
