import {
  BrowserRuntimeConnection,
  BrowserWindowMessageConnection,
  MESSAGE_DIRECTION,
  connectionProxy,
} from '@aeternity/aepp-sdk';

window.browser = require('webextension-polyfill');

const runContentScript = () => {
  const sendToOffscreen = (method, params) => new Promise((resolve) => {
    browser.runtime
      .sendMessage({
        target: 'offscreen',
        jsonrpc: '2.0',
        id: params.id || null,
        method,
        params,
      })
      .then((res) => resolve(res));
  });

  // Subscribe from postMessages from page
  window.addEventListener(
    'message',
    ({ data }) => {
      let { method } = data;
      if (!method) method = 'pageMessage';

      // Handle message from page and redirect to offscreen page
      if (!data.resolve) {
        sendToOffscreen(method, data);
      }
    },
    false,
  );

  /**
   * Aex-2 Aepp communication
   */
  const readyStateCheckInterval = setInterval(() => {
    if (document.readyState === 'complete') {
      clearInterval(readyStateCheckInterval);
      const port = browser.runtime.connect();
      const extConnection = new BrowserRuntimeConnection({ port });
      const pageConnection = new BrowserWindowMessageConnection({
        target: window,
        origin: window.origin,
        sendDirection: MESSAGE_DIRECTION.to_aepp,
        receiveDirection: MESSAGE_DIRECTION.to_waellet,
      });
      connectionProxy(pageConnection, extConnection);
    }
  }, 10);
};

runContentScript();
