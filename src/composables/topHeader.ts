import { computed, ref } from 'vue';
import {
  createNetworkWatcher,
  createPollingBasedOnMountedComponents,
} from './composablesHelpers';
import { useSdk } from './sdk';

import type { ITopHeader, IDefaultComposableOptions } from '../types';

const POLLING_INTERVAL = 30000;

const initPollingWatcher = createPollingBasedOnMountedComponents(POLLING_INTERVAL);
const topHeaderData = ref<ITopHeader>();
const { onNetworkChange } = createNetworkWatcher();

/**
 * Composable that provides the information about the last block of the blockchain.
 */
export function useTopHeaderData({ store }: IDefaultComposableOptions) {
  const { getSdk } = useSdk({ store });

  const topBlockHeight = computed(() => topHeaderData.value?.height || 0);

  async function updateTopHeaderData() {
    const sdk = await getSdk();
    topHeaderData.value = await sdk.api.getTopHeader();
  }

  async function fetchCurrentTopBlockHeight() {
    await updateTopHeaderData();
    return topBlockHeight.value;
  }

  onNetworkChange(store, () => updateTopHeaderData());

  initPollingWatcher(() => updateTopHeaderData());

  return {
    topHeaderData,
    topBlockHeight,
    updateTopHeaderData,
    fetchCurrentTopBlockHeight,
  };
}
