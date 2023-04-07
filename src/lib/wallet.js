import BrowserWindowMessageConnection from '@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection/browser-window-message';
import { isEqual, times } from 'lodash-es';
import {
  NODE_STATUS_CONNECTING,
  NODE_STATUS_ERROR,
  executeAndSetInterval,
  watchUntilTruthy,
  NODE_STATUS_CONNECTED,
} from '../popup/utils';
import { IN_FRAME } from './environment';
import store from '../store';
import Logger from './logger';
import { useMiddleware } from '../composables';

let initSdkRunning = false;

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

export default async function initSdk() {
  if (initSdkRunning) return;
  initSdkRunning = true;

  store.commit('setNodeStatus', NODE_STATUS_CONNECTING);
  try {
    await store.dispatch('sdkPlugin/initialize');
    await watchUntilTruthy(() => store.getters['sdkPlugin/sdk']);
    const { getMiddleware, initMiddleware } = useMiddleware({ store });

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

    await Promise.all([
      store.dispatch('initTippingContractInstances'),
      getMiddleware(),
    ]);
    store.commit('setNodeStatus', NODE_STATUS_CONNECTED);

    store.watch(
      (state, getters) => getters.activeNetwork,
      async (network, oldNetwork) => {
        if (isEqual(network, oldNetwork)) return;
        try {
          store.commit('setNodeStatus', NODE_STATUS_CONNECTING);
          await initMiddleware();
          store.commit('setNodeStatus', NODE_STATUS_CONNECTED);
        } catch (error) {
          store.commit('setNodeStatus', NODE_STATUS_ERROR);
          Logger.write(error);
        }
      },
    );
  } catch (e) {
    store.commit('setNodeStatus', NODE_STATUS_ERROR);
    Logger.write(e);
  } finally {
    initSdkRunning = false;
  }
}
