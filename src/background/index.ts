import { IPopupMessageData } from '@/types';
import { openPopup, removePopup, getPopup } from './bgPopupHandler';
import { updateDynamicRules } from './redirectRule';

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
function handleMessage(msg: IPopupMessageData, _: any, sendResponse: Function) {
  if (msg.target === 'background') {
    const {
      aepp,
      id,
      popupProps,
      popupType,
    } = msg.params!;
    switch (msg.method) {
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
      default:
        break;
    }
  }

  // forward messages to the offscreen page
  browser.runtime.sendMessage<IPopupMessageData>({
    ...msg,
    target: 'offscreen',
  });
  return true;
}

browser.runtime.onMessage.addListener(handleMessage);
browser.runtime.onInstalled.addListener(updateDynamicRules);
