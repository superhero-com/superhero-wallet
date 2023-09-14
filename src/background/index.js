import '@/lib/initPolyfills';
import '@/protocols/registerAdapters';
import { UNFINISHED_FEATURES } from '@/constants';
import initDeeplinkHandler from './deeplinkHandler';
import * as wallet from './wallet';
import Logger from '../lib/logger';
import { useAccounts } from '../composables';

Logger.init({ background: true });
initDeeplinkHandler();

browser.runtime.onMessage.addListener(async (msg) => {
  const { method } = msg;

  if (method === 'reload') {
    wallet.disconnect();
    window.location.reload();
    return null;
  }

  if (method === 'checkHasAccount') {
    const { isLoggedIn } = useAccounts();
    return isLoggedIn.value;
  }

  if (UNFINISHED_FEATURES && method === 'paste') {
    let result = '';
    const textarea = document.createElement('textarea');
    document.body.appendChild(textarea);
    textarea.focus();
    if (document.execCommand('paste')) {
      result = textarea.value;
    }
    document.body.removeChild(textarea);
    return result;
  }

  return true;
});

wallet.init();
