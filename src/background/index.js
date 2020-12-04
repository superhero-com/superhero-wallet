import { isEmpty } from 'lodash-es';
import '../lib/initEnv';
import '../lib/initPolyfills';
import initDeeplinkHandler from './deeplink-handler';
import { switchNode } from './utils';
import popupConnections from './popup-connection';
import RedirectChainNames from './redirect-chain-names';
import wallet from './wallet';
import TipClaimRelay from './tip-claim-relay';
import { buildTx } from '../popup/utils';
import { popupProps } from '../popup/utils/config';
import { AEX2_METHODS, CONNECTION_TYPES, HDWALLET_METHODS } from '../popup/utils/constants';
import { detectConnectionType } from '../popup/utils/helper';
import { getPhishingUrls, phishingCheckUrl, setPhishingUrl } from '../popup/utils/phishing-detect';
import walletController from './wallet-controller';
import Logger from '../lib/logger';
import { getState } from '../store/plugins/persistState';

if (window.IS_EXTENSION_BACKGROUND) {
  Logger.init({ background: true });
  RedirectChainNames.init();
  initDeeplinkHandler();

  const postPhishingData = async (data) => {
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    const message = { method: 'phishingCheck', ...data };
    tabs.forEach(({ id }) => browser.tabs.sendMessage(id, message).catch(console.log));
  };

  const openTipPopup = (pageUrl) =>
    browser.windows.create({
      url: browser.extension.getURL(`./popup/popup.html#/tip?url=${encodeURIComponent(pageUrl)}`),
      type: 'popup',
      height: 600,
      width: 375,
    });

  browser.runtime.onMessage.addListener(async (msg, sender) => {
    const { method, params, from, type, data, url: tipUrl } = msg;

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
      const { account } = await getState();
      if (!account || isEmpty(account)) return false;
    }

    if (from === 'content') {
      const [{ url }] = await browser.tabs.query({ active: true, currentWindow: true });
      if (type === 'readDom' && (data.address || data.chainName)) {
        const {
          current: { network },
        } = await getState();
        if (sender.url === url && network === 'Mainnet')
          TipClaimRelay.checkUrlHasBalance(url, data);
      }
      if (type === 'openTipPopup') openTipPopup(tipUrl || url);
    }

    return true;
  });

  wallet.init();
  browser.runtime.onConnect.addListener(async (port) => {
    if (port.sender.id !== browser.runtime.id) return;

    switch (detectConnectionType(port)) {
      case CONNECTION_TYPES.EXTENSION:
        port.onMessage.addListener(async ({ type, payload, uuid }) => {
          if (HDWALLET_METHODS.includes(type)) {
            port.postMessage({ uuid, res: await walletController[type](payload) });
          }
          if (AEX2_METHODS[type]) wallet[type](payload);

          if (type === 'SWITCH_NETWORK') {
            await switchNode();
          }
        });
        break;
      case CONNECTION_TYPES.POPUP:
        popupConnections.addConnection(new URL(port.sender.url).searchParams.get('id'), port);
        break;
      case CONNECTION_TYPES.OTHER:
        wallet.addConnection(port);
        break;
      default:
        throw new Error('Unknown connection type');
    }
  });

  const contextMenuItem = {
    id: 'superheroTip',
    title: 'Tip',
  };

  browser.webNavigation.onHistoryStateUpdated.addListener(async ({ tabId, url }) => {
    if (
      (({ origin, pathname }) => origin + pathname)(new URL(url)) !==
      'https://www.youtube.com/watch'
    )
      return;
    browser.tabs.executeScript(tabId, { file: 'other/youtube.js' });
  });

  browser.contextMenus.removeAll();
  browser.contextMenus.create(contextMenuItem);
  browser.contextMenus.onClicked.addListener(({ menuItemId, pageUrl }) => {
    if (menuItemId === 'superheroTip') openTipPopup(pageUrl);
  });
}

// eslint-disable-next-line import/prefer-default-export
export const handleMessage = ({ type, payload }) => {
  if (HDWALLET_METHODS.includes(type)) {
    return walletController[type](payload);
  }

  if (process.env.RUNNING_IN_TESTS) {
    if (type === 'POPUP_INFO') {
      if (payload.txType) {
        const props = popupProps.base;
        props.action.params.tx = buildTx(payload.txType).tx;
        return props;
      }
      return popupProps[payload.popupType];
    }
    if (['ACTION_DENY', 'ACTION_ACCEPT'].includes(type)) {
      return 'send';
    }
  }

  throw new Error(`Unknown message type: ${type}`);
};
