import { watch } from 'vue';
import { isEqual } from 'lodash-es';
import { BrowserRuntimeConnection } from '@aeternity/aepp-sdk';
import { CONNECTION_TYPES } from '@/constants';
import { removePopup, getPopup } from './popupHandler';
import { detectConnectionType } from './utils';
import store from './store';
import { useAeSdk, useNetworks } from '../composables';

window.browser = require('webextension-polyfill');

let isAeSdkBlocked = false;
let connectionsQueue = [];

const addAeppConnection = async (port) => {
  const { getAeSdk } = useAeSdk({ store });
  const aeSdk = await getAeSdk();
  const connection = new BrowserRuntimeConnection({ port });
  const clientId = aeSdk.addRpcClient(connection);
  await aeSdk.shareWalletInfo(clientId);
  const shareWalletInfo = setInterval(
    () => !isAeSdkBlocked && aeSdk.shareWalletInfo(clientId),
    3000,
  );
  port.onDisconnect.addListener(() => clearInterval(shareWalletInfo));
};

export async function init() {
  const { activeNetwork } = useNetworks();
  const { isAeSdkReady, getAeSdk, resetNode } = useAeSdk({ store });

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
        if (!isAeSdkReady.value) {
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
  await getAeSdk();

  connectionsQueue.forEach(addAeppConnection);
  connectionsQueue = [];

  watch(
    activeNetwork,
    async (newValue, oldValue) => {
      if (isAeSdkBlocked || isEqual(newValue, oldValue)) {
        return;
      }
      try {
        isAeSdkBlocked = true;
        await resetNode(oldValue, newValue);
      } finally {
        isAeSdkBlocked = false;
      }
    },
  );

  store.watch(
    (state) => state.accounts?.activeIdx,
    async (oldVal, newVal) => {
      const aeSdk = await getAeSdk();
      if (!isEqual(oldVal, newVal) && aeSdk) {
        aeSdk._pushAccountsToApps();
      }
    },
  );
}

export async function disconnect() {
  const { getAeSdk } = useAeSdk({ store });
  const aeSdk = await getAeSdk();

  aeSdk._clients.forEach((aepp, aeppId) => {
    if (aepp.status && aepp.status !== 'DISCONNECTED') {
      aepp.rpc.connection.sendMessage(
        { method: 'connection.close', params: { reason: 'bye' }, jsonrpc: '2.0' },
        true,
      );
      aepp.rpc.connection.disconnect();
      browser.tabs.reload(aepp.rpc.connection.port.sender.tab.id);
    }
    aeSdk.removeRpcClient(aeppId);
  });
}
