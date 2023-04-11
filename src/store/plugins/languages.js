import { createI18n } from 'vue-i18n';
import en from '../../popup/locales/en.json';

const fallbackLocale = 'en';

export const i18n = createI18n({
  allowComposition: true,
  fallbackLocale,
  locale: fallbackLocale,
  messages: { en },
});

const languages = {
  en: {
    name: 'English',
    getMessages: () => import(/* webpackChunkName: "locale-en" */ '../../popup/locales/en.json'),
  },
  cn: {
    name: '中国人',
    getMessages: () => import(/* webpackChunkName: "locale-cn" */ '../../popup/locales/cn.json'),
  },
};

const fetchAndSetLocale = async (languageCode) => {
  if (!i18n.global.availableLocales.includes(languageCode)) {
    const messages = (await languages[languageCode].getMessages()).default;
    i18n.global.setLocaleMessage(languageCode, messages);
  }
  i18n.global.locale = languageCode;
};

const preferredLocale = (() => {
  const code = navigator.language.split('-')[0];
  return languages[code] ? code : fallbackLocale;
})();

export default (store) => {
  store.registerModule('languages', {
    namespaced: true,
    state: {
      activeCode: store.state.languages?.activeCode || preferredLocale,
    },
    getters: {
      list: () => Object.entries(languages)
        .map(([code, { name }]) => ({ code, name }))
        .sort(),
      active: ({ activeCode }, { list }) => list.find(({ code }) => code === activeCode),
    },
    mutations: {
      setActiveCode(state, languageCode) {
        state.activeCode = languageCode;
      },
    },
  });

  store.watch(
    ({ languages: { activeCode } }) => activeCode,
    (activeCode) => fetchAndSetLocale(activeCode),
    { immediate: true },
  );
};
