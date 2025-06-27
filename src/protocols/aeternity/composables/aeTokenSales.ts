import { computed } from 'vue';
import camelCaseKeysDeep from 'camelcase-keys-deep';
import { Encoded } from '@aeternity/aepp-sdk';
import { uniqBy } from 'lodash-es';

import { tg as t } from '@/popup/plugins/i18n';
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

const TIMEOUT_LIMIT = 5000;

let composableInitialized = false;

interface TokenFactory {
  contractId: Encoded.ContractAddress;
}

interface TokenFactoryRaw extends TokenFactory {
  description: string;
}

function normalizeTokenSales(ITokenSaleRaw: any): ITokenSale {
  return {
    address: ITokenSaleRaw.address,
    creatorAddress: ITokenSaleRaw.creatorAddress,
    daoBalance: ITokenSaleRaw.daoBalance,
    decimals: ITokenSaleRaw.decimals,
    marketCap: ITokenSaleRaw.marketCap,
    name: ITokenSaleRaw.name,
    networkId: ITokenSaleRaw.networkId,
    ownerAddress: ITokenSaleRaw.ownerAddress,
    price: ITokenSaleRaw.price,
    saleAddress: ITokenSaleRaw.saleAddress,
    symbol: ITokenSaleRaw.symbol,
    totalSupply: ITokenSaleRaw.totalSupply,
  };
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

const customTokenSalesUrls = useStorageRef<Record<string, string[]>>(
  {},
  STORAGE_KEYS.customTokenSalesUrls,
);

export const useAeTokenSales = createCustomScopedComposable(() => {
  const { activeNetwork, onNetworkChange, onNetworkRemoved } = useNetworks();

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

  function fetchTokenSales(tokenSalesUrl: string) {
    return async (path: string) => {
      const res = await fetchJson(`${tokenSalesUrl}/${path}`);
      const { items, meta } = res || {};
      return {
        data: items,
        meta,
        next: meta?.totalPages > meta?.currentPage
          ? `${path.split('?')[0]}?page=${(meta?.currentPage ?? 0) + 1}`
          : '',
      };
    };
  }

  /**
   * Loading first encountered valid additional information
   * about contractId and saving it in tokenSales list,
   * if contractId belongs to token sale.
   * @param contractId - sale address or token address
   * @returns void
   */
  async function loadTokenSalesInfoByContractId(
    contractId: Encoded.ContractAddress,
  ): Promise<void> {
    const tokenSalesUrls = [
      ...(activeNetwork.value.type !== NETWORK_TYPE_CUSTOM
        ? [AE_TOKEN_SALES_URLS[activeNetwork.value.type]]
        : []),
      ...(customTokenSalesUrls.value[activeNetwork.value.name] || []),
    ];
    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < tokenSalesUrls.length; i++) {
      try {
        // eslint-disable-next-line no-await-in-loop
        const response = await fetchJson(`${tokenSalesUrls[i]}/tokens/${contractId}`);
        tokenSales.value = uniqBy(
          [...tokenSales.value, ...(response ? [normalizeTokenSales(response)] : [])],
          'address',
        );
        return;
      } catch (e) {
        /** NOOP */
      }
    }
  }

  async function loadTokenSalesInfoByAccount(
    tokenSalesUrl: string,
    address: Encoded.AccountAddress,
  ): Promise<ITokenSale[]> {
    try {
      const response = camelCaseKeysDeep(await fetchAllPages(
        () => fetchTokenSales(tokenSalesUrl)(`accounts/${address}/tokens`),
        fetchTokenSales(tokenSalesUrl),
      ));
      return response?.map(({ token }: any) => normalizeTokenSales(token));
    } catch (e) {
      handleUnknownError(e);
      return [];
    }
  }

  async function loadAllTokenFactoriesInfo() {
    const tokenSalesUrls = [
      ...(activeNetwork.value.type !== NETWORK_TYPE_CUSTOM
        ? [AE_TOKEN_SALES_URLS[activeNetwork.value.type]]
        : []),
      ...(customTokenSalesUrls.value[activeNetwork.value.name] || []),
    ];
    await Promise.all(
      tokenSalesUrls.map(async (url) => {
        const response = await fetchJson(`${url}/contracts`);
        tokenFactories.value = uniqBy(
          [
            ...tokenFactories.value,
            ...(response.map(({ contractId }: TokenFactoryRaw) => ({ contractId })) || []),
          ],
          'contractId',
        );
      }),
    );
  }

  async function loadAllTokenSalesInfoByAccount(address: Encoded.AccountAddress) {
    const tokenSalesUrls = [
      ...(activeNetwork.value.type !== NETWORK_TYPE_CUSTOM
        ? [AE_TOKEN_SALES_URLS[activeNetwork.value.type]]
        : []),
      ...(customTokenSalesUrls.value[activeNetwork.value.name] || []),
    ];
    const currentNetworkName = activeNetwork.value.name;
    const allTokenSalesInfo = await Promise.all(
      tokenSalesUrls.map((url) => loadTokenSalesInfoByAccount(url, address)),
    );
    if (currentNetworkName !== activeNetwork.value.name) {
      return;
    }
    allTokenSalesInfo.forEach((response) => {
      tokenSales.value = uniqBy([...tokenSales.value, ...response], 'address');
    });
  }

  async function validateTokenSalesUrl(url: string): Promise<{
    error?: string; result?: boolean;
  }> {
    const timeoutError = new Error('Timeout');
    try {
      if (customTokenSalesUrls.value[activeNetwork.value.name]?.includes(url)) {
        return { error: t('pages.tokenSales.errorUrlExists') };
      }
      const [tokens, contracts] = await Promise.all([
        Promise.race(
          [
            fetchTokenSales(url)('tokens'),
            new Promise((_r, reject) => setTimeout(() => reject(timeoutError), TIMEOUT_LIMIT)),
          ],
        ),
        Promise.race([
          fetchJson(`${url}/contracts`),
          new Promise((_r, reject) => setTimeout(() => reject(timeoutError), TIMEOUT_LIMIT)),
        ]),
      ]);
      // Check is actually lightweight, we might want to check a lot more than just
      // the first page of tokens, and if the contracts exist
      if ((tokens as any)?.meta?.totalPages && contracts?.[0]?.contractId) {
        return { result: true };
      }
      return { error: t('pages.tokenSales.errorInvalidUrl') };
    } catch (e: any) {
      if (e.message === timeoutError.message) {
        return { error: t('pages.tokenSales.errorTimeout') };
      }
      return { error: t('pages.tokenSales.errorInvalidUrl') };
    }
  }

  function addCustomTokenSalesUrl(url: string) {
    customTokenSalesUrls.value[activeNetwork.value.name] = [
      ...(customTokenSalesUrls.value[activeNetwork.value.name] || []),
      url,
    ];
  }

  function removeCustomTokenSalesUrl(url: string) {
    customTokenSalesUrls.value[activeNetwork.value.name] = (
      customTokenSalesUrls.value[activeNetwork.value.name] || []
    ).filter((u) => u !== url);
  }

  if (!composableInitialized) {
    composableInitialized = true;
    initPollingWatcher(() => loadAllTokenFactoriesInfo());

    onNetworkChange(async (network, oldNetwork) => {
      if (network.name !== oldNetwork.name) {
        tokenSales.value = [];
        tokenFactories.value = [];
        await loadAllTokenFactoriesInfo();
      }
    });

    onNetworkRemoved((oldNetwork) => {
      if (oldNetwork.name in customTokenSalesUrls.value) {
        delete customTokenSalesUrls.value[oldNetwork.name];
      }
    });
  }

  return {
    customTokenSalesUrls,
    tokenFactories,
    tokenSales,
    tokenSaleAddresses,
    tokenContractAddresses,
    addCustomTokenSalesUrl,
    loadTokenSalesInfoByContractId,
    loadAllTokenSalesInfoByAccount,
    removeCustomTokenSalesUrl,
    tokenSaleAddressToTokenContractAddress,
    validateTokenSalesUrl,
  };
});
