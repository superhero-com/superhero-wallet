import genUuid from 'uuid';
import '../../lib/initPolyfills';
import { handleMessage } from '../../background';

let internalPostMessage;
let contentPostMessage;

const ensureBackgroundInitialised = async () => {
  if (internalPostMessage) return;
  if (process.env.IS_EXTENSION) {
    const background = await browser.runtime.connect({
      name: window.RUNNING_IN_POPUP ? 'POPUP' : 'EXTENSION',
    });
    const pendingRequests = {};
    background.onMessage.addListener(({ uuid, res }) => {
      if (!pendingRequests[uuid]) {
        throw new Error(`Can't find request with id: ${uuid}`);
      }
      pendingRequests[uuid].resolve(res);
    });
    internalPostMessage = (message) => {
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

export const ensureContentScriptInitialized = async () => {
  if (contentPostMessage) return;
  if (process.env.IS_EXTENSION) {
    const pendingMessages = {};
    browser.runtime.onMessage.addListener(({ uuid, data }) => {
      if (!pendingMessages[uuid]) {
        throw new Error(`Can't find message with id: ${uuid}`);
      }
      pendingMessages[uuid].resolve(data);
    });
    contentPostMessage = async (message, tab) => {
      const id = genUuid();
      await browser.tabs.sendMessage(tab, { data: { ...message, uuid: id } });
      return new Promise((resolve, reject) => {
        pendingMessages[id] = { resolve, reject };
      });
    };
  }
};

export const postMessageToContent = async (message, tab) => {
  await ensureContentScriptInitialized();
  return contentPostMessage(message, tab);
};
