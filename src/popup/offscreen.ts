import '@/lib/initPolyfills';
import '@/protocols/registerAdapters';
import { IS_FIREFOX, UNFINISHED_FEATURES } from '@/constants/environment';
import * as wallet from '../background/offscreen/wallet';
import { useAccounts } from '../composables/accounts';
import updateDynamicRules from '../background/redirectRule';

// If browser is FF, load the redirectRule script because background is not loaded from the manifest
// in FF we have to use the offscreen.html as background page
if (IS_FIREFOX) {
  browser.runtime.onInstalled.addListener(updateDynamicRules);
}

browser.runtime.onMessage.addListener(async (msg: any) => {
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
