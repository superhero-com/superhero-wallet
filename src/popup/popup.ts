import '../lib/environment';
import '../lib/initPolyfills';
import { createApp } from 'vue';
import { IonicVue } from '@ionic/vue';
import store from '../store';
import router from './router';
import { i18n } from '../store/plugins/languages';
import registerModals from './router/modals';
import Logger from '../lib/logger';
import App from './App.vue';
import LoaderComponent from './components/Loader.vue';

import '../styles/fullscreen-message.scss';

/* Core CSS required for Ionic components to work properly */
import '@ionic/vue/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/vue/css/normalize.css';
import '@ionic/vue/css/structure.css';
import '@ionic/vue/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/vue/css/padding.css';
import '@ionic/vue/css/text-alignment.css';
import '@ionic/vue/css/text-transformation.css';
import '@ionic/vue/css/flex-utils.css';
import '@ionic/vue/css/display.css';
import '../styles/ionic.scss';

registerModals();
const app = createApp(App);
app.use(IonicVue, { mode: 'md' });
app.use(i18n);
app.use(store);
app.use(router);
app.component('Loader', LoaderComponent);
app.mount('#app');
Logger.init({ app });
