import '../lib/environment';
import '../lib/initPolyfills';
import initDeeplinkHandler from './deeplink-handler';
import * as wallet from './wallet';
import Logger from '../lib/logger';
import PushNotification from '../lib/pushNotification';
import store from './store';
import { useAccounts } from '../composables';

Logger.init({ background: true });
PushNotification.init();

initDeeplinkHandler();

browser.runtime.onMessage.addListener(async (msg) => {
  const { method } = msg;

  if (method === 'reload') {
    wallet.disconnect();
    window.location.reload();
    return null;
  }

  if (method === 'checkHasAccount') {
    const { isLoggedIn } = useAccounts({ store });
    return isLoggedIn.value;
  }

  if (process.env.UNFINISHED_FEATURES && method === 'paste') {
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
