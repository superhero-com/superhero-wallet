import { createI18n } from 'vue-i18n';
import en from '@/popup/locales/en-US.json';

export interface ILanguageConfig {
  name: string;
  getMessages: () => Promise<any>;
}

export const SUPPORTED_LANGUAGES = {
  'en-US': 'en-US',
  'zh-CN': 'zh-CN',
} as const;

export type SupportedLanguage = keyof typeof SUPPORTED_LANGUAGES;

export const FALLBACK_LOCALE = SUPPORTED_LANGUAGES['en-US'];

export const i18n = createI18n({
  allowComposition: true,
  fallbackLocale: FALLBACK_LOCALE,
  locale: FALLBACK_LOCALE,
  messages: { en },
});

// @ts-expect-error type coming from VueI18n is excessively deep and possibly infinite
export const tg = i18n.global.t;

export const languages: Record<SupportedLanguage, ILanguageConfig> = {
  [SUPPORTED_LANGUAGES['en-US']]: {
    name: 'English',
    getMessages: () => en,
  },
  [SUPPORTED_LANGUAGES['zh-CN']]: {
    name: '中文（简体，中国）',
    getMessages: () => import(/* webpackChunkName: "locale-zh-CN" */ '../locales/zh-CN.json'),
  },
};
