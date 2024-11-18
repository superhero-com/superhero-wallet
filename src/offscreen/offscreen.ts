import '@/lib/initPolyfills';
import '@/protocols/registerAdapters';
import type { IBackgroundMessageData } from '@/types';
import type { EthRpcSupportedMethods } from '@/protocols/ethereum/types';

import {
  IS_FIREFOX,
  POPUP_METHODS,
  UNFINISHED_FEATURES,
} from '@/constants';
import { useWalletConnect } from '@/composables';
import { handleEthereumRpcMethod } from '@/protocols/ethereum/libs/EthereumRpcMethodsHandler';
import * as wallet from './wallet';
import { registerInPageContentScript, updateDynamicRules } from '../background/utils';

// If browser is FF, load the redirectRule script because background is not loaded from the manifest
// in FF we have to use the offscreen.html as background page
if (IS_FIREFOX) {
  browser.runtime.onInstalled.addListener(updateDynamicRules);
  registerInPageContentScript();
}

browser.runtime.onMessage.addListener(
  async ({ method, params: { aepp, rpcMethodParams = {} } = {} }: IBackgroundMessageData) => {
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

    if (typeof aepp === 'string' && method) {
      return handleEthereumRpcMethod(aepp, method as EthRpcSupportedMethods, rpcMethodParams);
    }

    return true;
  },
);

wallet.init();

// Initialize the WalletConnect state monitoring to allow opening the confirmation popup windows.
useWalletConnect({ offscreen: true });
