import BrowserRuntimeConnection from '@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection/browser-runtime';
import BrowserWindowMessageConnection from '@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection/browser-window-message';
import { getBrowserAPI } from '@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/helpers';
import { MESSAGE_DIRECTION } from '@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/schema';
import ContentScriptBridge from '@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/content-script-bridge';

window.browser = require('webextension-polyfill');

const runContentScript = () => {
  const sendToBackground = (method, params) => new Promise((resolve) => {
    browser.runtime
      .sendMessage({
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

      // Handle message from page and redirect to background script
      if (!data.resolve) {
        sendToBackground(method, data);
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
      const port = getBrowserAPI().runtime.connect();
      const extConnection = BrowserRuntimeConnection({
        connectionInfo: {
          description: 'Content Script to Extension connection',
          origin: window.origin,
        },
        port,
      });
      const pageConnection = BrowserWindowMessageConnection({
        connectionInfo: {
          description: 'Content Script to Page  connection',
          origin: window.origin,
        },
        origin: window.origin,
        sendDirection: MESSAGE_DIRECTION.to_aepp,
        receiveDirection: MESSAGE_DIRECTION.to_waellet,
      });
      const bridge = ContentScriptBridge({ pageConnection, extConnection });
      bridge.run();
    }
  }, 10);
};

runContentScript();
