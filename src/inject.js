import BrowserRuntimeConnection from '@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection/browser-runtime';
import BrowserWindowMessageConnection from '@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection/browser-window-message';
import { getBrowserAPI } from '@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/helpers';
import { MESSAGE_DIRECTION } from '@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/schema';
import ContentScriptBridge from '@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/content-script-bridge';
import { setInterval, clearInterval } from 'timers';

global.browser = require('webextension-polyfill');

const redirectToWarning = (hostname, href, extUrl = '') => {
  window.stop();
  let extensionUrl = 'chrome-extension';
  if (typeof chrome === 'undefined') {
    extensionUrl = 'moz-extension';
  }
  let redirectUrl = '';
  if (extUrl !== '') {
    redirectUrl = `${extUrl}phishing/phishing.html#hostname=${hostname}&href=${href}`;
  } else {
    redirectUrl = `${extensionUrl}://${browser.runtime.id}/phishing/phishing.html#hostname=${hostname}&href=${href}`;
  }
  window.location.href = redirectUrl;
};

const sendToBackground = (method, params) =>
  new Promise(resolve => {
    browser.runtime
      .sendMessage({
        jsonrpc: '2.0',
        id: params.id || null,
        method,
        params,
      })
      .then(res => {
        resolve(res);
      });
  });

sendToBackground('phishingCheck', { href: window.location.href });

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

const getAddresses = () => {
  const address = document.all[0].outerHTML.match(/(ak_[A-Za-z0-9]{49,50})/g);
  const chainName = document.all[0].outerHTML.match(/[A-Za-z0-9]+\.chain/g);

  return {
    address,
    chainName,
  };
};

const sendDomData = () => {
  const { address, chainName } = getAddresses();
  if (address || chainName) {
    setTimeout(() => {
      browser.runtime.sendMessage({
        from: 'content',
        type: 'readDom',
        data: {
          address,
          chainName,
        },
      });
    }, 1000);
  }
};

window.addEventListener('load', () => {
  sendDomData();
  document.addEventListener(
    'visibilitychange',
    () => {
      if (!document.hidden) {
        sendDomData();
      }
    },
    false,
  );
});

// Handle message from background and redirect to page
browser.runtime.onMessage.addListener(({ data }) => {
  const { method, blocked, extUrl, host, uuid, href } = data;
  if (method === 'phishingCheck' && blocked) {
    redirectToWarning(host, href, extUrl);
  } else if (method === 'getAddresses') {
    browser.runtime.sendMessage({ uuid, data: { ...getAddresses() } });
  }
});

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
