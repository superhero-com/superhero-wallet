import { watch } from 'vue';
import { isEqual } from 'lodash-es';
import { IN_FRAME } from '@/constants';
import {
  useMiddleware,
  useAeSdk,
  useNetworks,
  useAccounts,
} from '@/composables';
import { FramesConnection } from './FramesConnection';

let aeSdkBlocked = false;

export default async function initSdk() {
  const { activeNetwork } = useNetworks();
  const { getAeSdk, resetNode } = useAeSdk();
  const { getMiddleware } = useMiddleware();
  const { activeAccountGlobalIdx } = useAccounts();

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

  watch(
    activeAccountGlobalIdx,
    async (oldVal, newVal) => {
      if (!isEqual(oldVal, newVal) && aeSdk) {
        aeSdk._pushAccountsToApps();
      }
    },
  );
}
