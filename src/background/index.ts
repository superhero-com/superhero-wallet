import '@/lib/initPolyfills';
import { PopupActionType } from '@/types';
import { openPopup, removePopup, getPopup } from './bgPopupHandler';
import updateDynamicRules from './redirectRule';

let creating: Promise<void> | null; // A global promise to avoid concurrency issues
async function setupOffscreenDocument(path: string) {
  // Check all windows controlled by the service worker to see if one
  // of them is the offscreen document with the given path
  const offscreenUrl = browser.runtime.getURL(path);
  // @ts-expect-error
  const existingContexts = await browser.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT'],
    documentUrls: [offscreenUrl],
  });

  if (existingContexts.length > 0) {
    return;
  }

  // create offscreen document
  if (creating) {
    await creating;
  } else {
    // @ts-expect-error
    creating = browser.offscreen.createDocument({
      url: path,
      reasons: ['LOCAL_STORAGE'],
      justification: 'handle wallet-aepp communication',
    });
    await creating;
    creating = null;
  }
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
 *   ? see https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/onMessage#sending_an_asynchronous_response_using_sendresponse
 */
function handleMessage(msg: PopupMessageData, _: any, sendResponse: Function) {
  if (msg.target === 'background') {
    if (msg.method === 'openPopup') {
      const { popupType, aepp, params } = msg.params;
      openPopup(popupType, aepp, params).then((popupConfig) => {
        sendResponse(popupConfig);
      });
      return true;
    } if (msg.method === 'removePopup') {
      sendResponse(removePopup(msg.params.id));
      return false;
    } if (msg.method === 'getPopup') {
      sendResponse(getPopup(msg.params.id));
      return false;
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
