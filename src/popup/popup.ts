import '@/lib/initPolyfills';
import '@/protocols/registerAdapters';
import { createApp } from 'vue';
import { IonicVue } from '@ionic/vue';
import { IS_MOBILE_APP } from '@/constants';
import store from '../store';
import router from './router';
import { i18n } from '../store/plugins/languages';
import registerModals from './router/modals';
import Logger from '../lib/logger';
import App from './App.vue';

import '../styles/fullscreen-message.scss';

if (IS_MOBILE_APP) {
  window.screen.orientation?.lock('portrait');
}

registerModals();
const app = createApp(App);
app.use(IonicVue);
app.use(i18n);
app.use(store);
app.use(router);
app.mount('#app');

Logger.init({ app });
