import { BrowserRuntimeConnection } from '@aeternity/aepp-sdk-13';
import { CONNECTION_TYPES } from '../popup/utils/constants';
import { removePopup, getPopup } from './popupHandler';
import { detectConnectionType } from './utils';
import { useSdk13 } from '../composables';
import store from './store';

window.browser = require('webextension-polyfill');

let connectionsQueue = [];

const addAeppConnection = async (port) => {
  const { getSdk } = useSdk13({ store });
  const sdk = await getSdk();
  const connection = new BrowserRuntimeConnection({ port });
  const clientId = sdk.addRpcClient(connection);
  await sdk.shareWalletInfo(clientId);
  const shareWalletInfo = setInterval(() => sdk.shareWalletInfo(clientId), 3000);
  port.onDisconnect.addListener(() => clearInterval(shareWalletInfo));
};

export async function init() {
  const { isSdkReady, getSdk } = useSdk13({ store });

  browser.runtime.onConnect.addListener(async (port) => {
    if (port.sender.id !== browser.runtime.id) return;

    switch (detectConnectionType(port)) {
      case CONNECTION_TYPES.POPUP: {
        const id = new URL(port.sender.url).searchParams.get('id');
        const popup = getPopup(id);

        port.onMessage.addListener((msg) => {
          if (msg.type === 'getProps') {
            port.postMessage({ uuid: msg.uuid, res: popup?.props });
            return;
          }
          if (popup?.actions) {
            popup.actions[msg.type]();
          }
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
  await getSdk();

  connectionsQueue.forEach(addAeppConnection);
  connectionsQueue = [];
}

export async function disconnect() {
  const { getSdk } = useSdk13({ store });
  const sdk = await getSdk();

  sdk._clients.forEach((aepp, aeppId) => {
    if (aepp.status && aepp.status !== 'DISCONNECTED') {
      aepp.rpc.connection.sendMessage(
        { method: 'connection.close', params: { reason: 'bye' }, jsonrpc: '2.0' },
        true,
      );
      aepp.rpc.connection.disconnect();
      browser.tabs.reload(aepp.rpc.connection.port.sender.tab.id);
    }
    sdk.removeRpcClient(aeppId);
  });
}
