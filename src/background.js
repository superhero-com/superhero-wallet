import { phishingCheckUrl, getPhishingUrls, setPhishingUrl } from './popup/utils/phishing-detect';
import { checkAeppConnected, initializeSDK, removeTxFromStorage, detectBrowser, parseFromStorage } from './popup/utils/helper';
import WalletContorller from './wallet-controller';
import Notification from './notifications';
import rpcWallet from './lib/rpcWallet';
import { HDWALLET_METHODS, AEX2_METHODS, NOTIFICATION_METHODS } from './popup/utils/constants';
import TipClaimRelay from './lib/tip-claim-relay';
import { setController } from './lib/background-utils';

global.browser = require('webextension-polyfill');

setInterval(() => {
  browser.windows.getAll({}).then(wins => {
    if (wins.length == 0) {
      sessionStorage.removeItem('phishing_urls');
      browser.storage.local.remove('isLogged');
      browser.storage.local.remove('activeAccount');
    }
  });
}, 5000);

function getAccount() {
  return new Promise(resolve => {
    browser.storage.local.get('userAccount', data => {
      if (data.userAccount && data.userAccount.hasOwnProperty('publicKey')) {
        resolve({
          keypair: {
            publicKey: data.userAccount.publicKey,
            secretKey: data.userAccount.secretKey,
          },
        });
      }
    });
  });
}

const controller = new WalletContorller();
const notification = new Notification();
rpcWallet.init(controller);
setController(controller);
browser.runtime.onMessage.addListener(async (msg, sender, sendResponse) => {
  switch (msg.method) {
    case 'phishingCheck':
      const data = { ...msg, extUrl: browser.extension.getURL('./') };
      phishingCheckUrl(msg.params.hostname).then(res => {
        if (typeof res.result !== 'undefined' && res.result == 'blocked') {
          const whitelist = getPhishingUrls().filter(url => url === msg.params.hostname);
          if (whitelist.length) {
            data.blocked = false;
            return postPhishingData(data);
          }
          data.blocked = true;
          return postPhishingData(data);
        }
        data.blocked = false;
        return postPhishingData(data);
      });
      break;
    case 'setPhishingUrl':
      const urls = getPhishingUrls();
      urls.push(msg.params.hostname);
      setPhishingUrl(urls);
      break;
  }

  if (typeof msg.from !== 'undefined' && typeof msg.type !== 'undefined' && msg.from == 'content' && msg.type == 'readDom' && msg.data.length) {
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    tabs.forEach(({ title, url }) => {
      if (sender.url == url) {
        TipClaimRelay.checkUrlHasBalance(url, msg.data);
      }
    });
  }

  return true;
});

const checkPendingTx = () =>
  new Promise((resolve, reject) => {
    browser.storage.local.get('pendingTransaction').then(tx => {
      if (tx.hasOwnProperty('pendingTransaction')) {
        resolve(false);
      } else {
        resolve(false);
      }
    });
  });

const postPhishingData = data => {
  browser.tabs.query({ active: true, currentWindow: true }).then(tabs => {
    const message = { method: 'phishingCheck', data };
    tabs.forEach(({ id }) => browser.tabs.sendMessage(id, message));
  });
};

const postToContent = (data, tabId) => {
  const message = { method: 'aeppMessage', data };
  browser.tabs.sendMessage(tabId, message);
};

browser.runtime.onConnect.addListener(async port => {
  let extensionUrl = 'chrome-extension';
  if (detectBrowser() == 'Firefox') {
    extensionUrl = 'moz-extension';
  }

  const senderUrl = port.sender.url.split('?');
  const popupSender = Boolean(
    (port.name == 'popup' && port.sender.id == browser.runtime.id && senderUrl[0] == `${extensionUrl}://${browser.runtime.id}/popup/popup.html` && detectBrowser() != 'Firefox') ||
      (detectBrowser() == 'Firefox' && port.name == 'popup' && port.sender.id == browser.runtime.id)
  );

  if (!popupSender) {
    const check = rpcWallet.sdkReady(() => {
      rpcWallet.addConnection(port);
    });
    port.onDisconnect.addListener(p => {
      clearInterval(check);
    });
  } else {
    port.onMessage.addListener(({ type, payload, uuid }, sender) => {
      if (HDWALLET_METHODS.includes(type)) {
        controller[type](payload).then(res => {
          port.postMessage({ uuid, res });
        });
      }

      if (AEX2_METHODS.hasOwnProperty(type)) {
        rpcWallet[type](payload);
      }

      if (NOTIFICATION_METHODS.hasOwnProperty(type)) {
        notification[type](payload);
      }
    });
  }
});
