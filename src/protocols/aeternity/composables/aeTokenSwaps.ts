import { computed, ref } from 'vue';
import camelCaseKeysDeep from 'camelcase-keys-deep';

import { ITokenSwap } from '@/types';
import { NETWORK_TYPE_CUSTOM } from '@/constants';
import { fetchAllPages, fetchJson, handleUnknownError } from '@/utils';
import { useNetworks } from '@/composables';
import { AE_TOKEN_SWAPS_URLS } from '@/protocols/aeternity/config';
import { createPollingBasedOnMountedComponents } from '@/composables/composablesHelpers';

let composableInitialized = false;

const areTokenSwapsReady = ref(false);

const tokenSwapsUrl = ref('');

const POLLING_INTERVAL = 60000;

const initPollingWatcher = createPollingBasedOnMountedComponents(POLLING_INTERVAL);

/**
 * List of all token swap available
 */
const tokenSwaps = ref<ITokenSwap[]>([]);

export function useAeTokenSwaps() {
  const { activeNetwork, onNetworkChange } = useNetworks();

  const tokenSwapAddresses = computed(
    () => tokenSwaps.value.map((tokenSwap) => tokenSwap.saleAddress),
  );
  const tokenContractAddresses = computed(
    () => tokenSwaps.value.map((tokenSwap) => tokenSwap.address),
  );

  function tokenSwapAddressToTokenContractAddress(
    address: string,
  ): string {
    const tokenSwap = tokenSwaps.value.find((sale) => sale.saleAddress === address);
    return tokenSwap?.address ?? address;
  }

  async function fetchTokenSwaps(path: string) {
    const res = await fetchJson(`${tokenSwapsUrl.value}/${path}`);
    const meta = res?.meta;
    return {
      data: res?.items,
      meta,
      next: meta?.totalPages && meta.totalPages > meta?.currentPage
        ? `${path.split('?')[0]}?page=${(meta?.currentPage ?? 0) + 1}`
        : '',
    };
  }

  async function loadAllTokenSwaps() {
    areTokenSwapsReady.value = false;
    if (activeNetwork.value.type !== NETWORK_TYPE_CUSTOM) {
      tokenSwapsUrl.value = AE_TOKEN_SWAPS_URLS[activeNetwork.value.type];
      try {
        const response: ITokenSwap[] = camelCaseKeysDeep(await fetchAllPages(
          () => fetchTokenSwaps('tokens'),
          fetchTokenSwaps,
        ));
        tokenSwaps.value = response || [];
      } catch (e) {
        tokenSwaps.value = [];
        handleUnknownError(e);
      }
    } else {
      tokenSwaps.value = [];
    }
    areTokenSwapsReady.value = true;
  }

  if (!composableInitialized) {
    composableInitialized = true;
    initPollingWatcher(() => loadAllTokenSwaps());

    onNetworkChange(async (network, oldNetwork) => {
      if (network.type !== oldNetwork.type) {
        await loadAllTokenSwaps();
      }
    });
  }

  return {
    tokenSwaps,
    tokenSwapAddresses,
    tokenContractAddresses,
    areTokenSwapsReady,
    tokenSwapAddressToTokenContractAddress,
  };
}
