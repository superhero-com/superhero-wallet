import { watch } from 'vue';
import { isEqual } from 'lodash-es';
import type { Runtime } from 'webextension-polyfill';
import { BrowserRuntimeConnection } from '@aeternity/aepp-sdk';
import type { IBackgroundMessageData } from '@/types';
import {
  CONNECTION_TYPES,
  IS_FIREFOX,
  POPUP_ACTIONS,
  SESSION_METHODS,
} from '@/constants';
import {
  useAccounts,
  useAeSdk,
  useAuth,
  useNetworks,
} from '@/composables';
import { setSessionTimeout } from '@/background/bgPopupHandler';
import browser from 'webextension-polyfill';
import { removePopup, getPopup } from './popupHandler';
import { detectConnectionType } from './utils';

window.browser = browser;

let isAeSdkBlocked = false;
let connectionsQueue: Runtime.Port[] = [];

/**
 * Errors that surface when an aepp port is gone but our state still references it:
 * - `UnknownRpcClientError` / "RpcClient with id ... do not exist": the SDK's own
 *   port.onDisconnect listener already deleted the client from `_clients` before
 *   our cleanup ran.
 * - `NoWalletConnectedError`: SDK connection was already torn down.
 * - "Attempting to use a disconnected port object" / "message channel is closed":
 *   the dapp page entered bfcache or was discarded; `port.postMessage` throws.
 * These are all recoverable and must not crash the offscreen document.
 */
function isExpectedDisconnectedClientError(error: unknown): boolean {
  return error instanceof Error && (
    error.name === 'UnknownRpcClientError'
    || error.name === 'NoWalletConnectedError'
    || /RpcClient with id .* do not exist/.test(error.message)
    || /Attempting to use a disconnected port object/.test(error.message)
    || /message channel is closed/.test(error.message)
  );
}

const addAeppConnection = async (port: Runtime.Port) => {
  const { getAeSdk } = useAeSdk();
  const aeSdk = await getAeSdk();
  const connection = new BrowserRuntimeConnection({ port, debug: false });
  const clientId = aeSdk.addRpcClient(connection);
  let shareWalletInfoInterval: NodeJS.Timeout | undefined;
  let isDisconnected = false;

  const cleanup = () => {
    if (isDisconnected) return;
    isDisconnected = true;
    clearInterval(shareWalletInfoInterval);

    // The SDK auto-deletes the client when its own port.onDisconnect listener
    // fires (registered inside `addRpcClient`). The `has()` check covers the
    // common race; the try/catch is the safety net for the narrow window
    // between `has()` and the call.
    try {
      if (aeSdk._clients.has(clientId)) {
        aeSdk.removeRpcClient(clientId);
      }
    } catch (error) {
      if (!isExpectedDisconnectedClientError(error)) {
        throw error;
      }
    }
  };

  const shareWalletInfo = async () => {
    if (isAeSdkBlocked || isDisconnected) return;

    try {
      await aeSdk.shareWalletInfo(clientId);
    } catch (error) {
      if (!isExpectedDisconnectedClientError(error)) {
        throw error;
      }
      cleanup();
    }
  };

  port.onDisconnect.addListener(cleanup);
  await shareWalletInfo();
  if (!isDisconnected) {
    shareWalletInfoInterval = setInterval(() => {
      shareWalletInfo();
    }, 3000);
  }
};

export async function init() {
  const { activeNetwork } = useNetworks();
  const { activeAccount } = useAccounts();
  const { secureLoginTimeoutDecrypted } = useAuth();
  const { isAeSdkReady, getAeSdk, resetNode } = useAeSdk();

  browser.runtime.onConnect.addListener(async (port) => {
    if (port?.sender?.id !== browser.runtime.id) return;

    switch (detectConnectionType(port as Runtime.Port)) {
      case CONNECTION_TYPES.POPUP: {
        const id = new URL(port?.sender?.url!).searchParams.get('id');
        port.onMessage.addListener(async (msg: IBackgroundMessageData) => {
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
      case CONNECTION_TYPES.SESSION: {
        port.onDisconnect.addListener(async () => {
          if (IS_FIREFOX) {
            setSessionTimeout(+secureLoginTimeoutDecrypted.value!);
          } else {
            browser.runtime.sendMessage<IBackgroundMessageData>({
              target: 'background',
              method: SESSION_METHODS.setSessionTimeout,
              payload: +secureLoginTimeoutDecrypted.value!,
            });
          }
        });
        return;
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
      // If any of these three statements throws an expected disconnect error
      // the remaining ones are intentionally skipped: the port is already gone,
      // there's nothing left to send, disconnect, or reload.
      try {
        aepp.rpc.connection.sendMessage(
          { method: 'connection.close', params: { reason: 'bye' }, jsonrpc: '2.0' },
        );
        aepp.rpc.connection.disconnect();
        browser.tabs.reload((aepp.rpc.connection as BrowserRuntimeConnection).port.sender!.tab!.id);
      } catch (error) {
        if (!isExpectedDisconnectedClientError(error)) {
          throw error;
        }
      }
    }
    // Needed even when `aepp.status === 'DISCONNECTED'`: the SDK's `closeConnection`
    // RPC handler marks the client DISCONNECTED but leaves it in `_clients`.
    // The has() guard + catch defend against the SDK auto-removing it first
    // (see comment in `addAeppConnection.cleanup`).
    try {
      if (aeSdk._clients.has(aeppId)) {
        aeSdk.removeRpcClient(aeppId);
      }
    } catch (error) {
      if (!isExpectedDisconnectedClientError(error)) {
        throw error;
      }
    }
  });
}
