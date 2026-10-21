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
import { removePopup, getPopup, addSidePanel } from './popupHandler';
import { detectConnectionType } from './utils';

window.browser = browser;

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
  const { getAeSdk, isAeSdkReady } = useAeSdk();
  let isDisconnected = false;
  // The port may close while `getAeSdk` waits for an SDK update.
  const onDisconnectWhileWaiting = () => { isDisconnected = true; };
  port.onDisconnect.addListener(onDisconnectWhileWaiting);
  const aeSdk = await getAeSdk();
  port.onDisconnect.removeListener(onDisconnectWhileWaiting);
  if (isDisconnected) return;

  const connection = new BrowserRuntimeConnection({ port, debug: false });
  const clientId = aeSdk.addRpcClient(connection);
  let shareWalletInfoInterval: NodeJS.Timeout | undefined;

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
    if (!isAeSdkReady.value || isDisconnected) return;

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

/** The last call started the timeout (a number) rather than stopping it (`null`). */
let isTimeoutRunning = false;

function setBackgroundSessionTimeout(sessionTimeout: number | null) {
  isTimeoutRunning = sessionTimeout !== null;
  if (IS_FIREFOX) {
    setSessionTimeout(sessionTimeout);
  } else {
    browser.runtime.sendMessage<IBackgroundMessageData>({
      target: 'background',
      method: SESSION_METHODS.setSessionTimeout,
      payload: sessionTimeout,
    });
  }
}

export async function init() {
  const { activeNetwork } = useNetworks();
  const { activeAccount } = useAccounts();
  const { secureLoginTimeoutDecrypted, syncBackgroundEncryptionKey } = useAuth();
  const { getAeSdk, resetNode } = useAeSdk();
  let sessionKeepingPortsCount = 0;

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
            popup.actions[msg.type](msg.payload);
          }
        });

        port.onDisconnect.addListener(() => {
          // Settles the request of a popup closed without an answer
          getPopup(id!)?.actions.reject();
          removePopup(id!);
        });
        break;
      }
      case CONNECTION_TYPES.SIDE_PANEL: {
        addSidePanel(port as Runtime.Port);
        break;
      }
      case CONNECTION_TYPES.OTHER: {
        await addAeppConnection(port as Runtime.Port);
        break;
      }
      case CONNECTION_TYPES.SESSION: {
        /**
         * A shown page keeps the session until the last one closes, locks or gets hidden.
         * Not a dapp's confirmation popup (`?id=`), which could keep it for as long as
         * nobody answers.
         */
        const isKeepingSession = !new URL(port.sender!.url!).searchParams.has('id');
        if (isKeepingSession) {
          sessionKeepingPortsCount += 1;
          if (sessionKeepingPortsCount === 1) {
            setBackgroundSessionTimeout(null);
          }
        }
        port.onMessage.addListener((msg: IBackgroundMessageData) => {
          if (msg?.method === SESSION_METHODS.sessionKeyStored) {
            // Asks the background for the key at once: a dapp's popup disconnects right after
            // this, and with the "immediately" setting that drops the key.
            syncBackgroundEncryptionKey();
          }
        });
        port.onDisconnect.addListener(async () => {
          if (isKeepingSession) {
            sessionKeepingPortsCount -= 1;
          }
          if (!sessionKeepingPortsCount) {
            setBackgroundSessionTimeout(+secureLoginTimeoutDecrypted.value!);
          }
        });
        return;
      }
      default:
        throw new Error('Unknown connection type');
    }
  });

  /**
   * The setting is decrypted only once the session key is synced. A dapp's popup that closes
   * right after unlocking doesn't wait for that, so a timeout started with the default is
   * started again with the setting. A page opening meanwhile stops it, which ends this.
   */
  watch(secureLoginTimeoutDecrypted, (sessionTimeout) => {
    if (isTimeoutRunning) {
      setBackgroundSessionTimeout(+sessionTimeout!);
    }
  });
  await getAeSdk();

  watch(
    activeNetwork,
    (newValue, oldValue) => {
      if (!isEqual(newValue, oldValue)) {
        resetNode(newValue);
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
