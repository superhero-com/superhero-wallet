import { createApp } from 'vue';
import App from './App.vue';

window.browser = require('webextension-polyfill');

const app = createApp(App);
app.mount('#app');
