import { computed, ref } from 'vue';
import type { ITopHeader } from '@/types';
import { createPollingBasedOnMountedComponents } from './composablesHelpers';
import { useAeSdk } from './aeSdk';
import { createNetworkWatcher } from './networks';

const POLLING_INTERVAL = 30000;

const initPollingWatcher = createPollingBasedOnMountedComponents(POLLING_INTERVAL);
const topHeaderData = ref<ITopHeader>();
const { onNetworkChange } = createNetworkWatcher();

/**
 * Composable that provides the information about the last block of the blockchain.
 */
export function useTopHeaderData() {
  const { getAeSdk } = useAeSdk();

  const topBlockHeight = computed(() => topHeaderData.value?.height || 0);

  async function updateTopHeaderData() {
    const aeSdk = await getAeSdk();
    topHeaderData.value = await aeSdk.api.getTopHeader();
  }

  async function fetchCurrentTopBlockHeight() {
    await updateTopHeaderData();
    return topBlockHeight.value;
  }

  onNetworkChange(() => updateTopHeaderData());

  initPollingWatcher(() => updateTopHeaderData());

  return {
    topHeaderData,
    topBlockHeight,
    updateTopHeaderData,
    fetchCurrentTopBlockHeight,
  };
}
