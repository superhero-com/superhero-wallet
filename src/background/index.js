import '../lib/initEnv';
import '../lib/initPolyfills';
import initDeeplinkHandler from './deeplink-handler';
import RedirectChainNames from './redirect-chain-names';
import * as wallet from './wallet';
import TipClaimRelay from './tip-claim-relay';
import { handleUnknownError } from '../popup/utils/helper';
import { getPhishingUrls, phishingCheckUrl, setPhishingUrl } from '../popup/utils/phishing-detect';
import Logger from '../lib/logger';
import { getState } from '../store/plugins/persistState';
import store from './store';

Logger.init({ background: true });
RedirectChainNames.init();
initDeeplinkHandler();

const postPhishingData = async (data) => {
  const tabs = await browser.tabs.query({ active: true, currentWindow: true });
  const message = { method: 'phishingCheck', ...data };
  tabs.forEach(({ id }) => browser.tabs.sendMessage(id, message).catch(handleUnknownError));
};

const openTipPopup = (pageUrl) => browser.windows.create({
  url: browser.extension.getURL(`./popup/popup.html#/tips?url=${encodeURIComponent(pageUrl)}`),
  type: 'popup',
  height: 600,
  width: 375,
});

browser.runtime.onMessage.addListener(async (msg, sender) => {
  const {
    method, params, from, type, data, url: tipUrl,
  } = msg;

  if (method === 'reload') {
    wallet.disconnect();
    window.location.reload();
    return null;
  }

  if (method === 'phishingCheck') {
    const host = new URL(params.href).hostname;
    let blocked = false;
    const { result } = await phishingCheckUrl(host);
    if (result === 'blocked') {
      const whitelist = getPhishingUrls().filter((url) => url === host);
      blocked = !whitelist.length;
    }
    return postPhishingData({
      ...msg,
      data: {
        method,
        extUrl: browser.extension.getURL('./'),
        host,
        href: params.href,
        blocked,
      },
    });
  }

  if (method === 'setPhishingUrl') {
    const urls = getPhishingUrls();
    urls.push(params.hostname);
    setPhishingUrl(urls);
    return true;
  }

  if (method === 'checkHasAccount') {
    return store.getters.isLoggedIn;
  }

  if (method === 'paste') {
    let result = '';
    const textarea = document.createElement('textarea');
    document.body.appendChild(textarea);
    textarea.focus();
    if (document.execCommand('paste')) {
      result = textarea.value;
    }
    document.body.removeChild(textarea);
    return result;
  }

  if (from === 'content') {
    const [{ url }] = await browser.tabs.query({ active: true, currentWindow: true });
    if (type === 'readDom' && (data.address || data.chainName)) {
      const {
        current: { network },
      } = await getState();
      if (sender.url === url && network === 'Mainnet') TipClaimRelay.checkUrlHasBalance(url, data);
    }
    if (type === 'openTipPopup') openTipPopup(tipUrl || url);
  }

  return true;
});

wallet.init();

const contextMenuItem = {
  id: 'superheroTip',
  title: 'Tip',
};

browser.webNavigation.onHistoryStateUpdated.addListener(async ({ tabId, url }) => {
  if (
    (({ origin, pathname }) => origin + pathname)(new URL(url)) !== 'https://www.youtube.com/watch'
  ) return;
  browser.tabs.executeScript(tabId, { file: 'other/youtube.js' });
});

browser.contextMenus.removeAll();
browser.contextMenus.create(contextMenuItem);
browser.contextMenus.onClicked.addListener(({ menuItemId, pageUrl }) => {
  if (menuItemId === 'superheroTip') openTipPopup(pageUrl);
});
