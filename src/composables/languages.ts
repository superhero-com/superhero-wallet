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

    WalletStorage.set(ACTIVE_LANGUAGE_KEY, languageCode);
  }

  async function restoreLanguage() {
    const storedLanguage = await WalletStorage.get<SupportedLanguage>(ACTIVE_LANGUAGE_KEY);
    if (storedLanguage) {
      switchLanguage(storedLanguage);
    }
  }

  return {
    activeLanguage,
    restoreLanguage,
    switchLanguage,
  };
}
