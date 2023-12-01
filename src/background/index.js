import '@/lib/initPolyfills';
import { openPopup, removePopup, getPopup } from './bgPopupHandler';

let creating; // A global promise to avoid concurrency issues
async function setupOffscreenDocument(path) {
  // Check all windows controlled by the service worker to see if one
  // of them is the offscreen document with the given path
  const offscreenUrl = browser.runtime.getURL(path);
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

// TODO type msg.target and msg.method
function handleMessage(msg, sender, sendResponse) {
  if (msg.target === 'background') {
    if (msg.method === 'openPopup') {
      const { popupType, aepp, params } = msg.params;
      openPopup(popupType, aepp, params);
      return;
    } if (msg.method === 'removePopup') {
      removePopup(msg.params.id);
      return;
    } if (msg.method === 'getPopup') {
      sendResponse(getPopup(msg.params.id));
      return;
    }
  }

  // forward messages to the offscreen page
  // TODO type msg.target
  browser.runtime.sendMessage({
    ...msg,
    target: 'offscreen',
  });
}

browser.runtime.onMessage.addListener(handleMessage);
