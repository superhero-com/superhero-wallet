import uuid from 'uuid';
import store from '../../store';

global.browser = process.env.IS_EXTENSION
  ? require('webextension-polyfill')
  : {
      runtime: {
        getURL: url => url,
      },
      storage: {
        local: {
          get(key) {
            const keys = Array.isArray(key) ? key : [key];
            return Promise.resolve(keys.reduce((p, n) => ({ ...p, [n]: localStorage.getItem(n) }), {}));
          },
          set(object) {
            Object.entries(object).forEach(([key, value]) => localStorage.setItem(key, value));
            return Promise.resolve();
          },
          remove(key) {
            const keys = Array.isArray(key) ? key : [key];
            keys.forEach(k => localStorage.removeItem(k));
            return Promise.resolve();
          },
        },
      },
    };

export const start = browser => browser.runtime.connect({ name: 'popup' });

export const postMessage = async (connection, { type, payload }) => {
  const id = uuid();
  if (typeof connection.postMessage !== 'function') {
    connection = browser.runtime.connect({ name: 'popup' });
    store.commit('SET_BACKGROUND', connection);
  }
  connection.postMessage({ type, payload, uuid: id });
  return new Promise((resolve, reject) => {
    connection.onMessage.addListener(msg => {
      if (msg.uuid == id) {
        resolve(msg);
      }
    });
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
