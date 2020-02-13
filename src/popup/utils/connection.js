import genUuid from 'uuid';
import '../../lib/initPolyfills';
import { handleMessage } from '../../background';

let internalPostMessage;

const ensureBackgroundInitialised = async () => {
  if (internalPostMessage) return;
  if (process.env.IS_EXTENSION) {
    const background = await browser.runtime.connect({ name: window.RUNNING_IN_POPUP ? 'POPUP' : 'EXTENSION' });
    const pendingRequests = {};
    background.onMessage.addListener(({ uuid, res }) => {
      if (!pendingRequests[uuid]) {
        throw new Error(`Can't find request with id: ${uuid}`);
      }
      pendingRequests[uuid].resolve(res);
    });
    internalPostMessage = message => {
      const id = genUuid();
      background.postMessage({ ...message, uuid: id });
      return new Promise((resolve, reject) => {
        pendingRequests[id] = { resolve, reject };
      });
    };
  } else {
    internalPostMessage = handleMessage;
  }
};

export const postMessage = async ({ type, payload }) => {
  await ensureBackgroundInitialised();
  return internalPostMessage({ type, payload });
};

export const setMessageListener = async cb => {
  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    cb(message, sender, sendResponse);
  });
};

export const readWebPageDom = cb => {
  setMessageListener((message, sender, sendResponse) => {
    if (message.from === 'content' && message.type === 'readDom' && sender.id === browser.runtime.id) {
      cb({ address: message.data, host: sender.url }, sendResponse);
    }
  });
};
