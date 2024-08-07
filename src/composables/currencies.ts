import { computed, ref, watch } from 'vue';
import { difference, isEmpty } from 'lodash-es';
import type {
  CurrencyCode,
  CurrencyRates,
  ICurrency,
  MarketData,
  Protocol,
} from '@/types';
import {
  CURRENCIES,
  DEFAULT_LOCALE,
  STORAGE_KEYS,
} from '@/constants';
import {
  handleUnknownError,
  watchUntilTruthy,
} from '@/utils';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';
import { useAccounts } from '@/composables/accounts';
import { CoinGecko } from '@/lib/CoinGecko';
import { createPollingBasedOnMountedComponents } from './composablesHelpers';
import { useStorageRef } from './storageRef';

export interface UseCurrenciesOptions {
  pollingDisabled?: boolean;
}

let composableInitialized = false;

const POLLING_INTERVAL = 3600000;
const DEFAULT_CURRENCY_CODE: CurrencyCode = 'usd';

/**
 * AE Coin details with additional market info
 */
const marketData = ref<MarketData | null>(null);

/**
 * Stores the list of currencies with the AE coin fiat exchange rate for each of them.
 */
const currencyRates = useStorageRef<CurrencyRates>(
  {} as any,
  STORAGE_KEYS.currencyRates,
);
const isLoadingCurrencies = ref(false);

const currentCurrencyCode = useStorageRef<CurrencyCode>(
  DEFAULT_CURRENCY_CODE,
  STORAGE_KEYS.currency,
);

const initPollingWatcher = createPollingBasedOnMountedComponents(POLLING_INTERVAL);

export function useCurrencies({
  pollingDisabled = false,
}: UseCurrenciesOptions = {}) {
  const { protocolsInUse, isLoggedIn } = useAccounts();
  const currentCurrencyInfo = computed(
    (): ICurrency => CURRENCIES.find(({ code }) => code === currentCurrencyCode.value)!,
  );

  function getCurrentCurrencyRate(protocol: Protocol): number {
    return currencyRates.value?.[protocol]?.[currentCurrencyCode.value] || 0;
  }

  function getCoinGeckoCoinIdList() {
    return protocolsInUse.value.map(
      (protocol) => ProtocolAdapterFactory.getAdapter(protocol).coinGeckoCoinId,
    ).join(',');
  }

  async function loadCoinsData() {
    try {
      await watchUntilTruthy(isLoggedIn);

      const fetchedMarketData = await CoinGecko.fetchCoinMarketData(
        getCoinGeckoCoinIdList(),
        currentCurrencyCode.value,
      ) || [];

      // TODO Temporary solution. We need to map the coingecko IDs to our protocols.
      const convertedMarketData = Object.fromEntries(fetchedMarketData.map(
        (coinMarketData) => [coinMarketData.id as Protocol, coinMarketData],
      ));

      marketData.value = isEmpty(convertedMarketData) ? null : convertedMarketData as MarketData;
    } catch (e) {
      handleUnknownError(e);
      marketData.value = null;
    }
  }

  function setCurrentCurrency(currency: CurrencyCode) {
    currentCurrencyCode.value = currency;
    loadCoinsData();
  }

  async function loadCurrencyRates() {
    isLoadingCurrencies.value = true;

    const fetchedCurrencyRates = await CoinGecko.fetchCoinCurrencyRates(
      getCoinGeckoCoinIdList(),
    );

    if (fetchedCurrencyRates) {
      currencyRates.value = fetchedCurrencyRates;
    }
    isLoadingCurrencies.value = false;
  }

  /**
   * @returns value formatted as a currency according to the user's browser settings
   *   eg.: "23 789,98 £", "$ 25.269,00"
   */
  function formatCurrency(value: number): string {
    return new Intl.NumberFormat(
      DEFAULT_LOCALE,
      { style: 'currency', currencyDisplay: 'narrowSymbol', currency: currentCurrencyCode.value },
    ).format(value);
  }

  /**
   * @param value Selected protocol coin amount
   * @param protocol used protocol
   * @returns Selected protocol coin converted to fiat
   */
  function getFiat(value: number, protocol: Protocol): number {
    return +(getCurrentCurrencyRate(protocol) * value).toFixed(2);
  }

  /**
   * @param value Selected protocol coin amount
   * @param protocol used protocol
   * @returns Selected protocol coin converted to fiat and formatted as a currency
   *   according to the user's browser settings
   */
  function getFormattedFiat(value: number, protocol: Protocol) {
    return formatCurrency(getFiat(value, protocol));
  }

  /**
   * Does the same as `getFormattedFiat` but avoids displaying small fractions
   * by rounding them to 0.01.
   * @param value Selected protocol coin amount
   * @param protocol used protocol
   */
  function getFormattedAndRoundedFiat(value: number, protocol: Protocol): string {
    if (!getCurrentCurrencyRate(protocol) || value === 0) {
      return formatCurrency(0);
    }
    const converted = getFiat(value, protocol);
    return (converted < 0.01) ? `<${formatCurrency(0.01)}` : formatCurrency(converted);
  }

  if (!pollingDisabled) {
    initPollingWatcher(() => loadCurrencyRates());
  }

  if (!composableInitialized) {
    composableInitialized = true;

    // Every time user adds account of new protocol we need to immediately fetch
    // the rates for this protocol.
    watch(protocolsInUse, (currentValue, oldValue) => {
      if (
        oldValue.length > 0 // Avoid fetching before establishing the accounts
        && difference(currentValue, oldValue).length && !isLoadingCurrencies.value
      ) {
        loadCurrencyRates();
      }
    });
  }

  return {
    CURRENCIES,
    marketData,
    currencyRates,
    currentCurrencyCode,
    currentCurrencyInfo,
    getCurrentCurrencyRate,
    loadCoinsData,
    loadCurrencyRates,
    setCurrentCurrency,
    formatCurrency,
    getFiat,
    getFormattedFiat,
    getFormattedAndRoundedFiat,
  };
}
