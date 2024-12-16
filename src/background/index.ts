import type { IBackgroundMessageData } from '@/types';
import {
  openPopup,
  removePopup,
  getPopup,
  getSessionEncryptionKey,
  setSessionTimeout,
} from './bgPopupHandler';
import { registerInPageContentScript, updateDynamicRules } from './utils';

(async () => {
  // Check all windows controlled by the service worker to see if one
  // of them is the offscreen document with the given path
  const offscreenUrl = browser.runtime.getURL('offscreen.html');

  // @ts-expect-error - browser type is not complete
  const existingContexts = await browser.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT'],
    documentUrls: [offscreenUrl],
  });

  if (existingContexts.length > 0) {
    return;
  }

  // @ts-expect-error - browser type is not complete
  await browser.offscreen.createDocument({
    url: offscreenUrl,
    reasons: ['LOCAL_STORAGE'],
    justification: 'handle wallet-aepp communication',
  });
})();

/**
 * @see https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/onMessage#sending_an_asynchronous_response_using_sendresponse
 */
const handleMessage: browser.runtime.onMessageBool = (
  msg: IBackgroundMessageData,
  sender: browser.runtime.MessageSender,
  sendResponse: Function,
) => {
  if (msg.target === 'background') {
    const {
      aepp,
      id,
      popupProps,
      popupType,
    } = msg.params ?? {};
    switch (msg.method) {
      case 'chainChanged':
        browser.tabs.query({ active: true, lastFocusedWindow: true }).then(([tab]) => {
          if (tab.id) {
            browser.tabs.sendMessage(tab.id, {
              superheroWalletApproved: true,
              method: msg.method,
              result: msg.params?.rpcMethodParams?.result,
              type: 'result',
            });
          }
        });
        break;
      case 'openPopup':
        openPopup(popupType!, aepp!, popupProps).then((popupConfig) => {
          sendResponse(popupConfig);
        });
        return true;
      case 'removePopup':
        sendResponse(removePopup(id!));
        return false;
      case 'getPopup':
        sendResponse(getPopup(id!));
        return false;
      case 'getSessionEncryptionKey':
        getSessionEncryptionKey().then((encryptionKey) => {
          sendResponse(encryptionKey);
        });
        return true;
      case 'setSessionTimeout':
        sendResponse(setSessionTimeout(msg.payload));
        return false;
      default:
        break;
    }
  }
  return true;
};

browser.runtime.onMessage.addListener(handleMessage);
browser.runtime.onInstalled.addListener(updateDynamicRules);

registerInPageContentScript();
