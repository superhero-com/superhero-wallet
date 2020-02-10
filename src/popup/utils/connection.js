import uuid from 'uuid';
import '../../lib/initPolyfills';

let background;
const pendingRequests = {};

const messageHandler = message => {
  if (!pendingRequests[message.uuid]) {
    throw new Error(`Can't find request with id: ${message.uuid}`);
  }
  pendingRequests[message.uuid].resolve(message);
};

const ensureBackgroundInitialised = async () => {
  if (background) return;
  if (process.env.IS_EXTENSION) {
    background = await browser.runtime.connect({ name: 'popup' });
    background.onMessage.addListener(messageHandler);
  } else {
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = '../background.html';
    document.body.appendChild(iframe);
    await new Promise(resolve => iframe.addEventListener('load', resolve));
    window.addEventListener('message', event => {
      if (event.source !== iframe.contentWindow) return;
      messageHandler(event.data);
    });
    background = {
      postMessage: message => iframe.contentWindow.postMessage(message, window.location.origin),
    };
  }
};

export const postMessage = async ({ type, payload }) => {
  await ensureBackgroundInitialised();
  const id = uuid();
  background.postMessage({ type, payload, uuid: id });
  return new Promise((resolve, reject) => {
    pendingRequests[id] = { resolve, reject };
  });
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
