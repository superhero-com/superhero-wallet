import type { IBackgroundMessageData } from '@/types';
import {
  openPopup,
  removePopup,
  getPopup,
  getSessionEncryptionKey,
  setSessionTimeout,
} from './bgPopupHandler';
import { isExtensionPageSender } from './messageGuards';
import { registerInPageContentScript, updateDynamicRules } from './utils';

(async () => {
  // Check all windows controlled by the service worker to see if one
  // of them is the offscreen document with the given path
  const offscreenUrl = browser.runtime.getURL('offscreen.html');

  const existingContexts = await browser.runtime.getContexts({
    // @ts-expect-error - browser type is not complete
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
const handleMessage: Parameters<typeof browser.runtime.onMessage.addListener>[0] = (
  msg: IBackgroundMessageData,
  sender,
  sendResponse,
): any => {
  // Extension pages only: content scripts carry the extension id too,
  // but run inside web pages and send nothing to the background.
  if (!isExtensionPageSender(sender)) {
    return undefined;
  }
  if (msg.target === 'background') {
    const {
      aepp,
      id,
      popupProps,
      popupType,
      rpcMethodParams,
      sidePanelWindowIds,
    } = msg.params ?? {};
    // An event carries its value here, unlike a request its params
    const eventResult = Array.isArray(rpcMethodParams) ? undefined : rpcMethodParams?.result;
    switch (msg.method) {
      case 'chainChanged':
      case 'accountsChanged':
        // Every tab, as the one the user looks at can be a confirmation window. Each content
        // script tells only its pages that may hear it.
        browser.tabs.query({}).then((tabs) => tabs.forEach((tab) => {
          if (tab.id) {
            browser.tabs.sendMessage(tab.id, {
              superheroWalletApproved: true,
              method: msg.method,
              result: eventResult,
              type: 'result',
            }).catch(() => {}); // A tab without the content script
          }
        }));
        break;
      case 'openPopup':
        openPopup(popupType!, aepp!, popupProps, sidePanelWindowIds).then((popupConfig) => {
          sendResponse(popupConfig);
        });
        return true;
      case 'removePopup':
        sendResponse(removePopup(id!));
        return undefined;
      case 'getPopup':
        sendResponse(getPopup(id!));
        return undefined;
      case 'getSessionEncryptionKey':
        getSessionEncryptionKey().then((encryptionKey) => {
          sendResponse(encryptionKey);
        });
        return true;
      case 'setSessionTimeout':
        sendResponse(setSessionTimeout(msg.payload));
        return undefined;
      default:
        break;
    }
  }
  return undefined;
};

browser.runtime.onMessage.addListener(handleMessage);
browser.runtime.onInstalled.addListener(updateDynamicRules);

registerInPageContentScript();
