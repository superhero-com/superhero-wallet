import BrowserRuntimeConnection from '@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection/browser-runtime';
import { CONNECTION_TYPES } from '../popup/utils/constants';
import { detectConnectionType } from './utils';
import { removePopup, getPopup } from './popupHandler';
import { useSdk } from '../composables';
import store from './store';

window.browser = require('webextension-polyfill');

let connectionsQueue = [];

const addAeppConnection = async (port) => {
  const { getSdk } = useSdk({ store });
  const sdk = await getSdk();
  const connection = BrowserRuntimeConnection({
    connectionInfo: { id: port.sender.frameId },
    port,
  });
  sdk.addRpcClient(connection);
  sdk.shareWalletInfo(port.postMessage.bind(port));
  const shareWalletInfo = setInterval(() => sdk.shareWalletInfo(port.postMessage.bind(port)), 3000);
  port.onDisconnect.addListener(() => clearInterval(shareWalletInfo));
};

export async function init() {
  const { isSdkReady } = useSdk({ store });

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
        if (!isSdkReady.value) {
          if (!connectionsQueue) connectionsQueue = [];
          connectionsQueue.push(port);
          port.onDisconnect.addListener(() => {
            connectionsQueue = connectionsQueue.filter((p) => p !== port);
          });
          return;
        }

        await addAeppConnection(port);
        break;
      }
      default:
        throw new Error('Unknown connection type');
    }
  });

  connectionsQueue.forEach(addAeppConnection);
  connectionsQueue = [];
}

export async function disconnect() {
  const { getSdk } = useSdk({ store });
  const sdk = await getSdk();
  Object.values(sdk.rpcClients).forEach((aepp) => {
    if (aepp.info.status && aepp.info.status !== 'DISCONNECTED') {
      aepp.sendMessage(
        { method: 'connection.close', params: { reason: 'bye' }, jsonrpc: '2.0' },
        true,
      );
      aepp.disconnect();
      browser.tabs.reload(aepp.connection.port.sender.tab.id);
    }
    sdk.removeRpcClient(aepp.id);
  });
}
