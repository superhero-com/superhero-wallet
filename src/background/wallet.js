import BrowserRuntimeConnection from '@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection/browser-runtime';
import { CONNECTION_TYPES } from '../popup/utils/constants';
import { detectConnectionType } from '../popup/utils/helper';
import { removePopup, getPopup } from './popupHandler';
import store from './store';

window.browser = require('webextension-polyfill');

let connectionsQueue = [];

const addAeppConnection = (port) => {
  const connection = BrowserRuntimeConnection({
    connectionInfo: { id: port.sender.frameId },
    port,
  });
  store.getters['sdkPlugin/sdk'].addRpcClient(connection);
  store.getters['sdkPlugin/sdk'].shareWalletInfo(port.postMessage.bind(port));
  const shareWalletInfo = setInterval(() => store.getters['sdkPlugin/sdk'].shareWalletInfo(port.postMessage.bind(port)), 3000);
  port.onDisconnect.addListener(() => clearInterval(shareWalletInfo));
};

export async function init() {
  browser.runtime.onConnect.addListener(async (port) => {
    if (port.sender.id !== browser.runtime.id) return;

    switch (detectConnectionType(port)) {
      case CONNECTION_TYPES.POPUP: {
        const id = new URL(port.sender.url).searchParams.get('id');
        const { actions, props } = getPopup(id);

        port.onMessage.addListener((msg) => {
          if (msg.type === 'getProps') {
            port.postMessage({ uuid: msg.uuid, res: props });
            return;
          }
          actions[msg.type]();
        });

        port.onDisconnect.addListener(() => removePopup(id));
        break;
      }
      case CONNECTION_TYPES.OTHER: {
        if (!store.getters['sdkPlugin/sdk']) {
          if (!connectionsQueue) connectionsQueue = [];
          connectionsQueue.push(port);
          port.onDisconnect.addListener(() => {
            connectionsQueue = connectionsQueue.filter((p) => p !== port);
          });
          return;
        }

        addAeppConnection(port);
        break;
      }
      default:
        throw new Error('Unknown connection type');
    }
  });
  await store.dispatch('sdkPlugin/initialize');
  // eslint-disable-next-line no-underscore-dangle
  await store._watcherVM.$watchUntilTruly(() => store.getters['sdkPlugin/sdk']);

  connectionsQueue.forEach(addAeppConnection);
  connectionsQueue = [];
}

export function disconnect() {
  Object.values(store.getters['sdkPlugin/sdk'].rpcClients).forEach((aepp) => {
    if (aepp.info.status !== 'DISCONNECTED') {
      aepp.sendMessage(
        { method: 'connection.close', params: { reason: 'bye' }, jsonrpc: '2.0' },
        true,
      );
    }
    aepp.disconnect();
    browser.tabs.reload(aepp.connection.port.sender.tab.id);
    store.getters['sdkPlugin/sdk'].removeRpcClient(aepp.id);
  });
}
