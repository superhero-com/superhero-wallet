import { computed, ref } from 'vue';

import { ITokenSale } from '@/types';
import { NETWORK_TYPE_CUSTOM } from '@/constants';
import { fetchAllPages, fetchJson } from '@/utils';
import { useNetworks } from '@/composables';
import { AE_TOKEN_SALES_URLS } from '@/protocols/aeternity/config';

let composableInitialized = false;

const areTokenSalesInitialized = ref(false);

const tokenSalesUrl = ref('');

/**
 * List of all token sales available
 */
const tokenSales = ref<ITokenSale[]>([]);

export function useAeTokenSales() {
  const { activeNetwork, onNetworkChange } = useNetworks();

  if (activeNetwork.value.type !== NETWORK_TYPE_CUSTOM) {
    tokenSalesUrl.value = AE_TOKEN_SALES_URLS[activeNetwork.value.type];
  }

  const tokenSaleAddresses = computed(
    () => tokenSales.value.map((tokenSale) => tokenSale.sale_address),
  );
  const tokenContractAddresses = computed(
    () => tokenSales.value.map((tokenSale) => tokenSale.address),
  );

  function tokenSaleAddressToTokenContractAddress(
    address: string,
  ): string {
    const tokenSale = tokenSales.value.find((sale) => sale.sale_address === address);
    return tokenSale?.address ?? address;
  }

  async function fetchTokens(path: string) {
    const res = await fetchJson(`${tokenSalesUrl.value}/${path}`);
    return {
      data: res?.items,
      meta: res?.meta,
      next: res?.links?.next,
    };
  }

  async function fetchAllTokens(): Promise<ITokenSale[]> {
    const response: ITokenSale[] = await fetchAllPages(
      () => fetchTokens('tokens'),
      fetchTokens,
    );
    return (response || []);
  }

  if (!composableInitialized) {
    composableInitialized = true;

    fetchAllTokens().then((tokens) => {
      tokenSales.value = tokens;
      areTokenSalesInitialized.value = true;
    });

    onNetworkChange(async (network, oldNetwork) => {
      if (network.type !== oldNetwork.type) {
        if (network.type !== NETWORK_TYPE_CUSTOM) {
          tokenSalesUrl.value = AE_TOKEN_SALES_URLS[network.type];
          tokenSales.value = await fetchAllTokens();
        } else {
          tokenSales.value = [];
        }
      }
    });
  }

  return {
    tokenSales,
    tokenSaleAddresses,
    tokenContractAddresses,
    areTokenSalesInitialized,

    fetchTokens,
    fetchAllTokens,
    tokenSaleAddressToTokenContractAddress,
  };
}
