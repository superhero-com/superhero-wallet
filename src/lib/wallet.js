import { isEqual } from 'lodash-es';
import { METHODS } from '@aeternity/aepp-sdk';
import { IN_FRAME } from './environment';
import store from '../store';
import { FramesConnection } from './FramesConnection';
import { useMiddleware, useSdk } from '../composables';

let sdkBlocked = false;

if (IN_FRAME) {
  store.registerModule('sdk-frame-reset', {
    actions: {
      async reset() {
        const { getSdk } = useSdk({ store });
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
  const { getSdk, resetNode } = useSdk({ store });

  const { getMiddleware } = useMiddleware({ store });

  const [sdk] = await Promise.all([getSdk(), getMiddleware()]);

  if (IN_FRAME && !FramesConnection.initialized) {
    FramesConnection.init(sdk);
  }

  store.watch(
    (state, getters) => getters.activeNetwork,
    async (newValue, oldValue) => {
      if (sdkBlocked || isEqual(newValue, oldValue)) {
        return;
      }
      try {
        sdkBlocked = true;
        resetNode(oldValue, newValue);
      } finally {
        sdkBlocked = false;
      }
    },
  );

  store.watch(
    (state) => state.accounts?.activeIdx,
    async (oldVal, newVal) => {
      if (!isEqual(oldVal, newVal) && sdk) {
        sdk._pushAccountsToApps();
      }
    },
  );
}
