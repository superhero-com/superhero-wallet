import '../lib/environment';
import '../lib/initPolyfills';
import { createApp } from 'vue';
import store from '../store';
import router from './router';
import { i18n } from '../store/plugins/languages';
import registerModals from './router/modals';
import Logger from '../lib/logger';
import App from './App.vue';
import LoaderComponent from './components/Loader.vue';

import '../styles/fullscreen-message.scss';

registerModals();
const app = createApp(App);
app.use(i18n);
app.use(store);
app.use(router);
app.component('Loader', LoaderComponent);
app.mount('#app');

Logger.init({ app });
