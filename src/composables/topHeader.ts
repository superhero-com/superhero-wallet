import { computed, ref } from 'vue';
import type { ITopHeader } from '@/types';
import { createPollingBasedOnMountedComponents } from './composablesHelpers';
import { useNetworks } from './networks';
import { useAeSdk } from './aeSdk';

const POLLING_INTERVAL = 30000;

let initialized = false;

const initPollingWatcher = createPollingBasedOnMountedComponents(POLLING_INTERVAL);
const topHeaderData = ref<ITopHeader>();

/**
 * Composable that provides the information about the last block of the blockchain.
 */
export function useTopHeaderData() {
  const { onNetworkChange } = useNetworks();
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

  initPollingWatcher(() => updateTopHeaderData());

  if (!initialized) {
    initialized = true;

    onNetworkChange(() => {
      updateTopHeaderData();
    });
  }

  return {
    topHeaderData,
    topBlockHeight,
    updateTopHeaderData,
    fetchCurrentTopBlockHeight,
  };
}
