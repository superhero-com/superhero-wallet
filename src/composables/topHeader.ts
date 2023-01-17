import { computed, ref } from '@vue/composition-api';
import type { Store } from 'vuex';
import { ITopHeader } from '../types/index';
import { createPollingBasedOnMountedComponents } from './composablesHelpers';
import { useSdk } from './sdk';

interface UseTopHeaderOptions {
  /**
   * TODO: Temporary solution to avoid dependency circle
   */
  store: Store<any>
}

const POLLING_INTERVAL = 30000;

const initPollingWatcher = createPollingBasedOnMountedComponents();
const topHeaderData = ref<ITopHeader>();

/**
 * Composable that provides the information about the last block of the blockchain.
 */
export function useTopHeaderData({ store }: UseTopHeaderOptions) {
  const { sdk } = useSdk({ store });

  const topBlockHeight = computed(() => topHeaderData.value?.height || 0);

  initPollingWatcher(async () => {
    topHeaderData.value = await sdk.value.api.getTopHeader();
  }, POLLING_INTERVAL);

  return {
    topBlockHeight,
  };
}
