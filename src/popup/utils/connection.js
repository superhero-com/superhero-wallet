import uuid from 'uuid';
import store from '../../store';

global.browser = require('webextension-polyfill');

export const start = async browser => browser.runtime.connect({ name: 'popup' });

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
    if (typeof message.from !== 'undefined' && message.from == 'content' && typeof message.type !== 'undefined' && message.type == 'readDom' && sender.id == browser.runtime.id) {
      cb({ address: message.data, host: sender.url }, sendResponse);
    }
  });
};
