import { isEqual } from 'lodash-es';
import { METHODS } from '@aeternity/aepp-sdk-13';
import {
  NODE_STATUS_CONNECTING,
  NODE_STATUS_ERROR,
  NODE_STATUS_CONNECTED,
} from '../popup/utils';
import { IN_FRAME } from './environment';
import store from '../store';
import Logger from './logger';
import { FramesConnection } from './FramesConnection';
import { useMiddleware, useSdk, useSdk13 } from '../composables';

let initSdkRunning = false;

if (IN_FRAME) {
  store.registerModule('sdk-frame-reset', {
    actions: {
      async reset() {
        const { getSdk } = useSdk13({ store });
        const sdk = await getSdk();

        Object.values(sdk._clients).forEach((aepp) => {
          if (aepp.info.status && aepp.info.status !== 'DISCONNECTED') {
            aepp.sendMessage(
              { method: METHODS.closeConnection, params: { reason: 'bye' }, jsonrpc: '2.0' },
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
  const { isSdkReady, getSdk, createNewNodeInstance } = useSdk({ store });
  const { getMiddleware } = useMiddleware({ store });

  store.watch(
    (state, getters) => getters.activeNetwork,
    async (network, oldNetwork) => {
      if (initSdkRunning || isEqual(network, oldNetwork)) {
        return;
      }
      initSdkRunning = true;

      try {
        store.commit('setNodeStatus', NODE_STATUS_CONNECTING);

        let sdk;

        if (isSdkReady.value) {
          [sdk] = await Promise.all([
            getSdk(),
            getMiddleware(),
          ]);
          sdk.pool.delete(oldNetwork.name);
          sdk.addNode(network.name, await createNewNodeInstance(network.url), true);
        } else {
          await Promise.all([
            store.dispatch('sdkPlugin/initialize'),
            getMiddleware(),
          ]);
          const { getSdk: getSdk13 } = useSdk13({ store });
          sdk = await getSdk13();

          if (IN_FRAME && !FramesConnection.initialized) {
            FramesConnection.init(sdk);
          }
        }

        // TODO node status should be kept in the SDK composable separated from the mdw status
        store.commit('setNodeStatus', NODE_STATUS_CONNECTED);
      } catch (error) {
        store.commit('setNodeStatus', NODE_STATUS_ERROR);
        Logger.write(error);
      } finally {
        initSdkRunning = false;
      }
    },
    { immediate: true },
  );
}
