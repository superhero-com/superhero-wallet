import { computed, ref } from 'vue';

import { ITokenSwap } from '@/types';
import { NETWORK_TYPE_CUSTOM } from '@/constants';
import { fetchAllPages, fetchJson } from '@/utils';
import { useNetworks } from '@/composables';
import { AE_TOKEN_SWAPS_URLS } from '@/protocols/aeternity/config';

let composableInitialized = false;

const areTokenSwapsInitialized = ref(false);

const tokenSwapsUrl = ref('');

/**
 * List of all token swap available
 */
const tokenSwaps = ref<ITokenSwap[]>([]);

export function useAeTokenSwaps() {
  const { activeNetwork, onNetworkChange } = useNetworks();

  if (activeNetwork.value.type !== NETWORK_TYPE_CUSTOM) {
    tokenSwapsUrl.value = AE_TOKEN_SWAPS_URLS[activeNetwork.value.type];
  }

  const tokenSwapAddresses = computed(
    () => tokenSwaps.value.map((tokenSwap) => tokenSwap.sale_address),
  );
  const tokenContractAddresses = computed(
    () => tokenSwaps.value.map((tokenSwap) => tokenSwap.address),
  );

  function tokenSwapAddressToTokenContractAddress(
    address: string,
  ): string {
    const tokenSwap = tokenSwaps.value.find((sale) => sale.sale_address === address);
    return tokenSwap?.address ?? address;
  }

  async function fetchTokens(path: string) {
    const res = await fetchJson(`${tokenSwapsUrl.value}/${path}`);
    return {
      data: res?.items,
      meta: res?.meta,
      next: res?.links?.next,
    };
  }

  async function fetchAllTokens(): Promise<ITokenSwap[]> {
    const response: ITokenSwap[] = await fetchAllPages(
      () => fetchTokens('tokens'),
      fetchTokens,
    );
    return (response || []);
  }

  if (!composableInitialized) {
    composableInitialized = true;

    fetchAllTokens().then((tokens) => {
      tokenSwaps.value = tokens;
      areTokenSwapsInitialized.value = true;
    });

    onNetworkChange(async (network, oldNetwork) => {
      if (network.type !== oldNetwork.type) {
        if (network.type !== NETWORK_TYPE_CUSTOM) {
          tokenSwapsUrl.value = AE_TOKEN_SWAPS_URLS[network.type];
          tokenSwaps.value = await fetchAllTokens();
        } else {
          tokenSwaps.value = [];
        }
      }
    });
  }

  return {
    tokenSwaps,
    tokenSwapAddresses,
    tokenContractAddresses,
    areTokenSwapsInitialized,

    fetchTokens,
    fetchAllTokens,
    tokenSwapAddressToTokenContractAddress,
  };
}
