import BrowserWindowMessageConnection from '@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection/browser-window-message';
import { times } from 'lodash-es';
import {
  executeAndSetInterval,
  watchUntilTruthy,
} from '../popup/utils';
import { IN_FRAME } from './environment';
import Logger from './logger';

if (IN_FRAME) {
  store.registerModule('sdk-frame-reset', {
    actions: {
      async reset({ rootGetters }) {
        Object.values(rootGetters['sdkPlugin/sdk'].rpcClients).forEach((aepp) => {
          if (aepp.info.status && aepp.info.status !== 'DISCONNECTED') {
            aepp.sendMessage(
              { method: 'connection.close', params: { reason: 'bye' }, jsonrpc: '2.0' },
              true,
            );
            aepp.disconnect();
          }
        });
      },
    },
  });
}

let initSdkRunning = false;

export async function initSdk(store) {
  if (initSdkRunning) return;
  initSdkRunning = true;
  try {
    await store.dispatch('sdkPlugin/initialize');
    const sdk = await watchUntilTruthy(() => store.getters['sdkPlugin/sdk']);

    if (IN_FRAME) {
      const getArrayOfAvailableFrames = () => [
        window.parent,
        ...times(window.parent.frames.length, (i) => window.parent.frames[i]),
      ];

      const connectedFrames = new Set();

      executeAndSetInterval(
        () => getArrayOfAvailableFrames()
          .filter((frame) => frame !== window)
          .forEach((target) => {
            if (connectedFrames.has(target)) return;
            connectedFrames.add(target);
            const connection = BrowserWindowMessageConnection({ target });
            const originalConnect = connection.connect;
            let intervalId;
            connection.connect = function connect(onMessage) {
              originalConnect.call(this, (data, origin, source) => {
                if (source !== target) return;
                clearInterval(intervalId);
                onMessage(data, origin, source);
              });
            };
            store.getters['sdkPlugin/sdk'].addRpcClient(connection);
            intervalId = executeAndSetInterval(() => {
              if (!getArrayOfAvailableFrames().includes(target)) {
                clearInterval(intervalId);
                return;
              }
              store.getters['sdkPlugin/sdk'].shareWalletInfo(connection.sendMessage.bind(connection));
            }, 3000);
          }),
        3000,
      );
    }

    await store.dispatch('initContractInstances');
  } catch (e) {
    Logger.write(e);
  } finally {
    initSdkRunning = false;
  }
}
