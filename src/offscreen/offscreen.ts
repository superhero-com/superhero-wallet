import '@/lib/initPolyfills';
import '@/protocols/registerAdapters';
import { IPopupMessageData } from '@/types';
import { IS_FIREFOX, POPUP_METHODS, UNFINISHED_FEATURES } from '@/constants';
import { useWalletConnect } from '@/composables';
import * as wallet from './wallet';
import { useAccounts } from '../composables/accounts';
import { updateDynamicRules } from '../background/redirectRule';

// If browser is FF, load the redirectRule script because background is not loaded from the manifest
// in FF we have to use the offscreen.html as background page
if (IS_FIREFOX) {
  browser.runtime.onInstalled.addListener(updateDynamicRules);
}

browser.runtime.onMessage.addListener(async ({ method }: IPopupMessageData) => {
  if (method === POPUP_METHODS.reload) {
    wallet.disconnect();
    window.location.reload();
    return null;
  }

  if (method === POPUP_METHODS.checkHasAccount) {
    const { isLoggedIn } = useAccounts();
    return isLoggedIn.value;
  }

  if (UNFINISHED_FEATURES && method === POPUP_METHODS.paste) {
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

// Initialize the WalletConnect state monitoring to allow opening the confirmation popup windows.
useWalletConnect({ offscreen: true });
