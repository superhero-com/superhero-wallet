import '@/lib/initPolyfills';
import { PopupActionType } from '@/types';
import { openPopup, removePopup, getPopup } from './bgPopupHandler';
import { updateDynamicRules } from './redirectRule';

async function setupOffscreenDocument(path: string) {
  // Check all windows controlled by the service worker to see if one
  // of them is the offscreen document with the given path
  const offscreenUrl = browser.runtime.getURL(path);
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
    url: path,
    reasons: ['LOCAL_STORAGE'],
    justification: 'handle wallet-aepp communication',
  });
}

setupOffscreenDocument(browser.runtime.getURL('offscreen.html'));

export type PopupMessageData = {
  target?: 'background' | 'offscreen';
  method?: 'openPopup' | 'removePopup' | 'getPopup';
  type?: PopupActionType;
  uuid?: string;
  params?: any;
  payload?: any;
};

/**
 *   @see https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/onMessage#sending_an_asynchronous_response_using_sendresponse
 */
function handleMessage(msg: PopupMessageData, _: any, sendResponse: Function) {
  if (msg.target === 'background') {
    const { popupType, aepp, params } = msg.params;
    switch (msg.method) {
      case 'openPopup':
        openPopup(popupType, aepp, params).then((popupConfig) => {
          sendResponse(popupConfig);
        });
        return true;
      case 'removePopup':
        sendResponse(removePopup(msg.params.id));
        return false;
      case 'getPopup':
        sendResponse(getPopup(msg.params.id));
        return false;
      default:
        break;
    }
  }

  // forward messages to the offscreen page
  browser.runtime.sendMessage<PopupMessageData>({
    ...msg,
    target: 'offscreen',
  });
  return true;
}

browser.runtime.onMessage.addListener(handleMessage);
browser.runtime.onInstalled.addListener(updateDynamicRules);
