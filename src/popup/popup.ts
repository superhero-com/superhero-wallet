import '@/lib/initPolyfills';
import '@/protocols/registerAdapters';
import { createApp } from 'vue';
import { IonicVue } from '@ionic/vue';
import { i18n } from '@/popup/plugins/i18n';
import initVeeValidateRules from '@/popup/plugins/veeValidate';
import router from './router';
import registerModals from './router/modals';
import Logger from '../lib/logger';
import App from './App.vue';

import '../styles/fullscreen-message.scss';

registerModals();
const app = createApp(App);
app.use(IonicVue);
app.use(i18n);
app.use(router);
app.mount('#app');

Logger.init({ app });

initVeeValidateRules();
