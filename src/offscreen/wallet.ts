import { watch } from 'vue';
import { isEqual } from 'lodash-es';
import type { Runtime } from 'webextension-polyfill';
import { BrowserRuntimeConnection } from '@aeternity/aepp-sdk';
import type { IPopupMessageData } from '@/types';
import { CONNECTION_TYPES, POPUP_ACTIONS } from '@/constants';
import { useAccounts, useAeSdk, useNetworks } from '@/composables';
import { removePopup, getPopup } from './popupHandler';
import { detectConnectionType } from './utils';

window.browser = require('webextension-polyfill');

let isAeSdkBlocked = false;
let connectionsQueue: Runtime.Port[] = [];

const addAeppConnection = async (port: Runtime.Port) => {
  const { getAeSdk } = useAeSdk();
  const aeSdk = await getAeSdk();
  const connection = new BrowserRuntimeConnection({ port, debug: false });
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
  const { activeAccount } = useAccounts();
  const { isAeSdkReady, getAeSdk, resetNode } = useAeSdk();

  browser.runtime.onConnect.addListener(async (port) => {
    if (port?.sender?.id !== browser.runtime.id) return;

    switch (detectConnectionType(port as Runtime.Port)) {
      case CONNECTION_TYPES.POPUP: {
        const id = new URL(port?.sender?.url!).searchParams.get('id');
        port.onMessage.addListener(async (msg: IPopupMessageData) => {
          const popup = getPopup(id!);

          if (msg.type === POPUP_ACTIONS.getProps) {
            port.postMessage({ uuid: msg.uuid, res: popup?.props });
            return;
          }
          if (msg.type && popup?.actions?.[msg.type]) {
            popup.actions[msg.type]();
          }
        });

        port.onDisconnect.addListener(() => removePopup(id!));
        break;
      }
      case CONNECTION_TYPES.OTHER: {
        if (!isAeSdkReady.value) {
          if (!connectionsQueue) connectionsQueue = [];
          connectionsQueue.push(port as Runtime.Port);
          port.onDisconnect.addListener(() => {
            connectionsQueue = connectionsQueue.filter((p) => p !== port);
          });
          return;
        }

        await addAeppConnection(port as Runtime.Port);
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

  watch(
    activeAccount,
    async (oldVal, newVal) => {
      const aeSdk = await getAeSdk();
      if (!isEqual(oldVal, newVal) && aeSdk) {
        aeSdk._pushAccountsToApps();
      }
    },
  );
}

export async function disconnect() {
  const { getAeSdk } = useAeSdk();
  const aeSdk = await getAeSdk();

  aeSdk._clients.forEach((aepp, aeppId) => {
    if (aepp.status && aepp.status !== 'DISCONNECTED') {
      aepp.rpc.connection.sendMessage(
        { method: 'connection.close', params: { reason: 'bye' }, jsonrpc: '2.0' },
      );
      aepp.rpc.connection.disconnect();
      // @ts-ignore
      browser.tabs.reload(aepp.rpc.connection.port.sender.tab.id);
    }
    aeSdk.removeRpcClient(aeppId);
  });
}
