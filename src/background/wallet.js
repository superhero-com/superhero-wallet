import { isEqual } from 'lodash-es';
import BrowserRuntimeConnection from '@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection/browser-runtime';
import { CONNECTION_TYPES } from '../popup/utils/constants';
import { executeAndSetInterval } from '../popup/utils';
import { removePopup, getPopup } from './popupHandler';
import { detectConnectionType } from './utils';
import store from './store';
import { useSdk } from '../composables';

window.browser = require('webextension-polyfill');

const { isSdkReady, getSdk, createNewNodeInstance } = useSdk({ store });

let initSdkRunning = false;
let connectionsQueue = [];

const addAeppConnection = async (port) => {
  const connection = BrowserRuntimeConnection({
    connectionInfo: { id: port.sender.frameId },
    port,
  });
  const sdk = await getSdk();
  sdk.addRpcClient(connection);
  const shareWalletInfo = executeAndSetInterval(
    () => sdk.shareWalletInfo(port.postMessage.bind(port)),
    3000,
  );
  port.onDisconnect.addListener(() => clearInterval(shareWalletInfo));
};

export async function init() {
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

        addAeppConnection(port);
        break;
      }
      default:
        throw new Error('Unknown connection type');
    }
  });
  await store.dispatch('sdkPlugin/initialize');
  await getSdk();

  connectionsQueue.forEach(addAeppConnection);
  connectionsQueue = [];

  // TODO remove watcher after migrating to SDK13
  store.watch(
    (state, getters) => getters.activeNetwork,
    async (network, oldNetwork) => {
      if (initSdkRunning || isEqual(network, oldNetwork)) {
        return;
      }
      try {
        initSdkRunning = true;
        const sdk = await getSdk();
        sdk.pool.delete(oldNetwork.name);
        sdk.addNode(network.name, await createNewNodeInstance(network.url), true);
      } finally {
        initSdkRunning = false;
      }
    },
  );
}

export async function disconnect() {
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
