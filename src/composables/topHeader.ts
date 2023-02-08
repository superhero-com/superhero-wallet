import { computed, ref } from '@vue/composition-api';
import { createPollingBasedOnMountedComponents } from './composablesHelpers';
import { useSdk } from './sdk';

import type { ITopHeader, IDefaultComposableOptions } from '../types';

const POLLING_INTERVAL = 30000;

const initPollingWatcher = createPollingBasedOnMountedComponents();
const topHeaderData = ref<ITopHeader>();

/**
 * Composable that provides the information about the last block of the blockchain.
 */
export function useTopHeaderData({ store }: IDefaultComposableOptions) {
  const { getSdk } = useSdk({ store });

  const topBlockHeight = computed(() => topHeaderData.value?.height || 0);

  initPollingWatcher(async () => {
    const sdk = await getSdk();
    topHeaderData.value = await sdk.api.getTopHeader();
  }, POLLING_INTERVAL);

  return {
    topBlockHeight,
  };
}
