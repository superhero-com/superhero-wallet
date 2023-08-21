import { createI18n } from 'vue-i18n';
import { Store } from 'vuex';
import en from '../../popup/locales/en.json';

const fallbackLocale = 'en';

export const i18n = createI18n({
  allowComposition: true,
  fallbackLocale,
  locale: fallbackLocale,
  messages: { en },
});

// @ts-ignore type coming from VueI18n is excessively deep and possibly infinite
export const tg = i18n.global.t;

const languages: Record<string, { name: string, getMessages: () => Promise<any> }> = {
  en: {
    name: 'English',
    getMessages: () => import(/* webpackChunkName: "locale-en" */ '../../popup/locales/en.json'),
  },
  cn: {
    name: '中国人',
    getMessages: () => import(/* webpackChunkName: "locale-cn" */ '../../popup/locales/cn.json'),
  },
};

const fetchAndSetLocale = async (languageCode: string) => {
  if (!(i18n.global.availableLocales as string[]).includes(languageCode)) {
    const messages = (await languages[languageCode].getMessages()).default;
    i18n.global.setLocaleMessage(languageCode, messages);
  }
  (i18n.global.locale as any).value = languageCode;
};

const preferredLocale = (() => {
  const code = navigator.language.split('-')[0];
  return languages[code] ? code : fallbackLocale;
})();

export default (store: Store<any>) => {
  store.registerModule('languages', {
    namespaced: true,
    state: {
      activeCode: store.state.languages?.activeCode || preferredLocale,
    },
    getters: {
      list: () => Object.entries(languages)
        .map(([code, { name }]) => ({ code, name }))
        .sort(),
      active: ({ activeCode }, { list }) => list.find(({ code }: any) => code === activeCode),
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
