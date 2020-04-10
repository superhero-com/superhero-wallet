import { setInterval } from 'timers';
import './lib/initPolyfills';
import { phishingCheckUrl, getPhishingUrls, setPhishingUrl } from './popup/utils/phishing-detect';
import { detectConnectionType } from './popup/utils/helper';
import { buildTx } from './popup/utils';
import WalletController from './wallet-controller';
import Notification from './notifications';
import rpcWallet from './lib/rpcWallet';
import {
  HDWALLET_METHODS,
  AEX2_METHODS,
  NOTIFICATION_METHODS,
  CONNECTION_TYPES,
  DEFAULT_NETWORK,
} from './popup/utils/constants';
import { popupProps } from './popup/utils/config';
import TipClaimRelay from './lib/tip-claim-relay';
import RedirectChainNames from './lib/redirect-chain-names';
import { setController, switchNode } from './lib/background-utils';
import { PopupConnections } from './lib/popup-connection';

const controller = new WalletController();

if (process.env.IS_EXTENSION && require.main.i === module.id) {
  RedirectChainNames.init();
  setInterval(() => {
    browser.windows.getAll({}).then(wins => {
      if (wins.length === 0) {
        sessionStorage.removeItem('phishing_urls');
      }
    });
  }, 5000);

  const notification = new Notification();
  setController(controller);

  const postPhishingData = async data => {
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    const message = { method: 'phishingCheck', data };
    tabs.forEach(({ id }) => browser.tabs.sendMessage(id, message));
  };

  browser.runtime.onMessage.addListener(async (msg, sender) => {
    switch (msg.method) {
      case 'phishingCheck': {
        const data = { ...msg, extUrl: browser.extension.getURL('./') };
        const host = new URL(msg.params.href).hostname;
        data.host = host;
        const { result } = await phishingCheckUrl(host);
        if (result === 'blocked') {
          const whitelist = getPhishingUrls().filter(url => url === host);
          if (whitelist.length) {
            data.blocked = false;
            return postPhishingData(data);
          }
          data.blocked = true;
          return postPhishingData(data);
        }
        data.blocked = false;
        return postPhishingData(data);
      }
      case 'setPhishingUrl': {
        const urls = getPhishingUrls();
        urls.push(msg.params.hostname);
        setPhishingUrl(urls);
        break;
      }
      default:
        break;
    }

    if (
      msg.from === 'content' &&
      msg.type === 'readDom' &&
      (msg.data.address || msg.data.chainName)
    ) {
      const tabs = await browser.tabs.query({ active: true, currentWindow: true });
      tabs.forEach(({ url }) => {
        if (sender.url === url && DEFAULT_NETWORK === 'Mainnet') {
          TipClaimRelay.checkUrlHasBalance(url, msg.data);
        }
      });
    }

    return true;
  });

  const popupConnections = PopupConnections();
  popupConnections.init();
  rpcWallet.init(controller, popupConnections);
  browser.runtime.onConnect.addListener(async port => {
    if (port.sender.id === browser.runtime.id) {
      const connectionType = detectConnectionType(port);
      if (connectionType === CONNECTION_TYPES.EXTENSION) {
        port.onMessage.addListener(async ({ type, payload, uuid }) => {
          if (HDWALLET_METHODS.includes(type)) {
            port.postMessage({ uuid, res: await controller[type](payload) });
          }
          if (AEX2_METHODS[type]) rpcWallet[type](payload);

          if (NOTIFICATION_METHODS[type]) {
            await switchNode();
            notification[type]();
          }
        });
      } else if (connectionType === CONNECTION_TYPES.POPUP) {
        const url = new URL(port.sender.url);
        const id = url.searchParams.get('id');

        popupConnections.addConnection(id, port);
      } else if (connectionType === CONNECTION_TYPES.OTHER) {
        const check = rpcWallet.sdkReady(() => {
          rpcWallet.addConnection(port);
        });
        port.onDisconnect.addListener(() => {
          clearInterval(check);
        });
      }
    }
  });
}

// eslint-disable-next-line import/prefer-default-export
export const handleMessage = ({ type, payload }) => {
  if (HDWALLET_METHODS.includes(type)) {
    return controller[type](payload);
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
