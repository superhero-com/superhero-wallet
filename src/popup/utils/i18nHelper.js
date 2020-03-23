/* eslint-disable global-require */
import Vue from 'vue';
import VueI18n from 'vue-i18n';
import en from '../locales/en.json';

Vue.use(VueI18n);

const fallbackLocale = 'en';

export const i18n = new VueI18n({
  locale: fallbackLocale,
  fallbackLocale,
  formatFallbackMessages: true,
  messages: { en },
});

export const langs = {
  en: {
    getMessages: () => require('../locales/en.json'),
  },
  cn: {
    getMessages: () => require(/* webpackChunkName: "locale-en" */ '../locales/cn.json'),
  },
};

export const fetchAndSetLocale = async languageCode => {
  if (!i18n.availableLocales.includes(languageCode)) {
    const messages = await langs[languageCode].getMessages();
    i18n.setLocaleMessage(languageCode, messages);
  }
  i18n.locale = languageCode;
};
