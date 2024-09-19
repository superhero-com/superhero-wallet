import { WalletStorage } from '@/lib/WalletStorage';
import {
  i18n,
  languages,
  SupportedLanguage,
} from '@/popup/plugins/i18n';

const ACTIVE_LANGUAGE_KEY = 'active-language';

export function useLanguages() {
  const activeLanguage = i18n.global.locale as any;

  async function switchLanguage(languageCode: SupportedLanguage) {
    if (languageCode === activeLanguage.value) {
      return;
    }
    if (!(i18n.global.availableLocales as string[]).includes(languageCode)) {
      const messages = (await languages[languageCode].getMessages()).default;
      i18n.global.setLocaleMessage(languageCode, messages);
    }
    (i18n.global.locale as any).value = languageCode;
    document.documentElement.setAttribute('lang', languageCode);

    WalletStorage.set(ACTIVE_LANGUAGE_KEY, languageCode);
  }

  function restoreLanguage() {
    const storedLanguage = WalletStorage.get<SupportedLanguage>(ACTIVE_LANGUAGE_KEY);
    if (storedLanguage) {
      switchLanguage(storedLanguage);
    } else {
      document.documentElement.setAttribute('lang', (i18n.global.locale as any).value);
    }
  }

  return {
    activeLanguage,
    restoreLanguage,
    switchLanguage,
  };
}
