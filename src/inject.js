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
  if (extUrl != '') {
    redirectUrl = `${extUrl}phishing/phishing.html#hostname=${hostname}&href=${href}`;
  } else {
    redirectUrl = `${extensionUrl}://${browser.runtime.id}/phishing/phishing.html#hostname=${hostname}&href=${href}`;
  }
  window.location.href = redirectUrl;
};

if (typeof navigator.clipboard === 'undefined') {
  // redirectToWarning(extractHostName(window.location.href),window.location.href)
} else {
  sendToBackground('phishingCheck', { href: window.location.href });
}

// Subscribe from postMessages from page
window.addEventListener(
  'message',
  ({ data }) => {
    let method = 'pageMessage';
    if (typeof data.method !== 'undefined') {
      method = data.method;
    }
    // Handle message from page and redirect to background script
    if (!data.hasOwnProperty('resolve')) {
      sendToBackground(method, data);
    }
  },
  false
);

// Handle message from background and redirect to page
browser.runtime.onMessage.addListener(({ data, method }, sender, sendResponse) => {
  if (data.method == 'phishingCheck') {
    if (data.blocked) {
      redirectToWarning(data.params.host, data.params.href, data.extUrl);
    }
  }
});

function sendToBackground(method, params) {
  return new Promise((resolve, reject) => {
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
}

const sendDomData = () => {
  const address = document.all[0].outerHTML.match(/(ak\_[A-Za-z0-9]{49,50})/g);
  const chainName = document.all[0].outerHTML.match(/[A-Za-z0-9]+\.chain/g);
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
    false
  );
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
