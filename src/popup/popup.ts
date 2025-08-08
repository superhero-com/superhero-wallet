/// <reference types="cypress" />

import '@/lib/initPolyfills';
import '@/protocols/registerAdapters';
import { App, createApp } from 'vue';
import { IonicVue } from '@ionic/vue';
import { i18n } from '@/popup/plugins/i18n';
import initVeeValidateRules from '@/popup/plugins/veeValidate';
import router from './router';
import registerModals from './router/modals';
import Logger from '../lib/logger';
import AppRoot from './App.vue';

import '@/styles/fullscreen-message.scss';

declare global {
  interface Window {
    Cypress?: Cypress.Cypress;
    __app__?: App<Element>;
  }
}

registerModals();
const app = createApp(AppRoot);
app.use(IonicVue);
app.use(i18n);
app.use(router);
app.mount('#app');

if (window.Cypress) {
  window.__app__ = app;
}

Logger.init({ app });

initVeeValidateRules();
