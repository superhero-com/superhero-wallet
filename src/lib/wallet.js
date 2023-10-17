import { watch } from 'vue';
import { isEqual } from 'lodash-es';
import { METHODS } from '@aeternity/aepp-sdk';
import { IN_FRAME } from '@/constants';
import { useMiddleware, useAeSdk, useNetworks } from '@/composables';
import store from '../store';
import { FramesConnection } from './FramesConnection';

let aeSdkBlocked = false;

if (IN_FRAME) {
  store.registerModule('sdk-frame-reset', {
    actions: {
      async reset() {
        const { getAeSdk } = useAeSdk();
        const aeSdk = await getAeSdk();

        Object.values(aeSdk._clients).forEach((aepp) => {
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
  const { activeNetwork } = useNetworks();
  const { getAeSdk, resetNode } = useAeSdk();
  const { getMiddleware } = useMiddleware();

  const [aeSdk] = await Promise.all([getAeSdk(), getMiddleware()]);

  if (IN_FRAME && !FramesConnection.initialized) {
    FramesConnection.init(aeSdk);
  }

  watch(
    activeNetwork,
    async (newValue, oldValue) => {
      if (aeSdkBlocked || isEqual(newValue, oldValue)) {
        return;
      }
      try {
        aeSdkBlocked = true;
        await resetNode(oldValue, newValue);
      } finally {
        aeSdkBlocked = false;
      }
    },
  );

  store.watch(
    (state) => state.accounts?.activeIdx,
    async (oldVal, newVal) => {
      if (!isEqual(oldVal, newVal) && aeSdk) {
        aeSdk._pushAccountsToApps();
      }
    },
  );
}
