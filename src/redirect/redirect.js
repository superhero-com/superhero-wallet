import { createApp } from 'vue';
import App from './App.vue';
import { i18n } from '../store/plugins/languages';

window.browser = require('webextension-polyfill');

const app = createApp(App);
app.use(i18n);
app.mount('#app');

export default app;
