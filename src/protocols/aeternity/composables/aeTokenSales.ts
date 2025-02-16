import { computed, ref } from 'vue';
import camelCaseKeysDeep from 'camelcase-keys-deep';

import { ITokenSale } from '@/types';
import { NETWORK_TYPE_CUSTOM, STORAGE_KEYS } from '@/constants';
import {
  createCustomScopedComposable,
  fetchAllPages,
  fetchJson,
  handleUnknownError,
} from '@/utils';
import { useNetworks } from '@/composables';
import { AE_TOKEN_SALES_URLS } from '@/protocols/aeternity/config';
import { createPollingBasedOnMountedComponents } from '@/composables/composablesHelpers';
import { useStorageRef } from '@/composables/storageRef';

const POLLING_INTERVAL = 60000;

let composableInitialized = false;

const areTokenSalesReady = ref(false);

const tokenSalesUrl = ref('');

interface TokenFactory {
  contractId: string;
  description: string;
}

const initPollingWatcher = createPollingBasedOnMountedComponents(POLLING_INTERVAL);

/**
 * List of all token sales available
 */
const tokenSales = useStorageRef<ITokenSale[]>(
  [],
  STORAGE_KEYS.tokenSales,
);

const tokenFactories = useStorageRef<TokenFactory[]>(
  [],
  STORAGE_KEYS.tokenFactories,
);

export const useAeTokenSales = createCustomScopedComposable(() => {
  const { activeNetwork, onNetworkChange } = useNetworks();

  const tokenSaleAddresses = computed(
    () => tokenSales.value.map((tokenSale) => tokenSale.saleAddress),
  );
  const tokenContractAddresses = computed(
    () => tokenSales.value.map((tokenSale) => tokenSale.address),
  );

  function tokenSaleAddressToTokenContractAddress(
    address: string,
  ): string {
    const tokenSale = tokenSales.value.find((sale) => sale.saleAddress === address);
    return tokenSale?.address ?? address;
  }

  async function fetchTokenSales(path: string) {
    const res = await fetchJson(`${tokenSalesUrl.value}/${path}`);
    const { items, meta } = res || {};
    return {
      data: items,
      meta,
      next: meta?.totalPages > meta?.currentPage
        ? `${path.split('?')[0]}?page=${(meta?.currentPage ?? 0) + 1}`
        : '',
    };
  }

  async function loadTokenSalesInfo() {
    areTokenSalesReady.value = false;
    if (activeNetwork.value.type !== NETWORK_TYPE_CUSTOM) {
      tokenSalesUrl.value = AE_TOKEN_SALES_URLS[activeNetwork.value.type];
      try {
        const response: ITokenSale[] = camelCaseKeysDeep(await fetchAllPages(
          () => fetchTokenSales('tokens'),
          fetchTokenSales,
        ));
        tokenFactories.value = (await fetchJson(`${tokenSalesUrl.value}/contracts`)) || [];
        tokenSales.value = response || [];
      } catch (e) {
        handleUnknownError(e);
      }
    } else {
      tokenSales.value = [];
    }
    areTokenSalesReady.value = true;
  }

  if (!composableInitialized) {
    composableInitialized = true;
    initPollingWatcher(() => loadTokenSalesInfo());

    onNetworkChange(async (network, oldNetwork) => {
      if (network.type !== oldNetwork.type) {
        await loadTokenSalesInfo();
      }
    });
  }

  return {
    tokenFactories,
    tokenSales,
    tokenSaleAddresses,
    tokenContractAddresses,
    areTokenSalesReady,
    tokenSaleAddressToTokenContractAddress,
  };
});
