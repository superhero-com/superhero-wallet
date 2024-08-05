import '@/lib/initPolyfills';
import '@/protocols/registerAdapters';
import { IOtherSettings, IPopupMessageData } from '@/types';
import {
  CONNECTION_TYPES,
  IS_FIREFOX,
  POPUP_METHODS,
  STORAGE_KEYS,
  UNFINISHED_FEATURES,
} from '@/constants';
import { WalletStorage } from '@/lib/WalletStorage';
import { useWalletConnect } from '@/composables';
import * as wallet from './wallet';
import { useAccounts } from '../composables/accounts';
import { updateDynamicRules } from '../background/redirectRule';

// If browser is FF, load the redirectRule script because background is not loaded from the manifest
// in FF we have to use the offscreen.html as background page
if (IS_FIREFOX) {
  browser.runtime.onInstalled.addListener(updateDynamicRules);
}

browser.runtime.onConnect.addListener((port) => {
  if (port.name === CONNECTION_TYPES.SESSION) {
    port.onDisconnect.addListener(async () => {
      const settings: IOtherSettings | null = await WalletStorage.get(STORAGE_KEYS.otherSettings);
      const sessionExpires = Date.now() + (settings?.secureLoginTimeout ?? 0);

      // browser.storage is not available in offscreen tab
      browser.runtime.sendMessage<IPopupMessageData>({
        target: 'background',
        method: POPUP_METHODS.setSessionExpires,
        payload: sessionExpires,
      });
    });
  }
});

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
