import {
  computed,
  ref,
  watch,
} from 'vue';
import BigNumber from 'bignumber.js';
import type {
  CurrencyCode,
  CurrencyRates,
  ICoin,
  ICurrency,
  Protocol,
} from '@/types';
import {
  CURRENCIES,
  PROTOCOL_AETERNITY,
} from '@/constants';
import {
  getLocalStorageItem,
  handleUnknownError,
  setLocalStorageItem,
} from '@/utils';
import {
  AE_COINGECKO_COIN_ID,
  AE_TOKEN_BASE_DATA,
} from '@/protocols/aeternity/config';

import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';
import { useAccounts } from '@/composables/accounts';
import { IDefaultComposableOptions } from '@/types';
import { difference } from 'lodash-es';
import { createPollingBasedOnMountedComponents } from './composablesHelpers';
import { CoinGecko } from '../lib/CoinGecko';

export interface UseCurrenciesOptions extends IDefaultComposableOptions {
  withoutPolling?: boolean;
  selectedProtocol?: Protocol;
}

const POLLING_INTERVAL = 3600000;
const LOCAL_STORAGE_CURRENCY_KEY = 'currency';
const DEFAULT_CURRENCY_CODE: CurrencyCode = 'usd';

/**
 * AE Coin details with additional market info
 */
const aeternityData = ref<ICoin>();

/**
 * Stores the list of currencies with the AE coin fiat exchange rate for each of them.
 */
const currencyRates = ref<CurrencyRates>({} as any);
const isLoadingCurrencies = ref(false);

const currentCurrencyCode = ref<CurrencyCode>(
  getLocalStorageItem<CurrencyCode>([LOCAL_STORAGE_CURRENCY_KEY]) || DEFAULT_CURRENCY_CODE,
);

const initPollingWatcher = createPollingBasedOnMountedComponents(POLLING_INTERVAL);

export function useCurrencies({
  withoutPolling = false,
  store,
  selectedProtocol = PROTOCOL_AETERNITY, // TODO - remove default value
}: UseCurrenciesOptions) {
  const { protocolsInUse } = useAccounts({ store });

  const minTipAmount = computed(() => 0.01 / (currencyRates.value?.[selectedProtocol].usd || 1));
  const currentCurrencyRate = computed(
    (): number => currencyRates.value?.[selectedProtocol]?.[currentCurrencyCode.value] || 0,
  );
  const currentCurrencyInfo = computed(
    (): ICurrency => CURRENCIES.find(({ code }) => code === currentCurrencyCode.value)!,
  );

  function getCoingeckoCoinIdList() {
    return protocolsInUse.value.map(
      (protocol) => ProtocolAdapterFactory.getAdapter(protocol).getCoingeckoCoinId(),
    );
  }

  async function loadAeternityData() {
    try {
      const aeMarketData = await CoinGecko.fetchCoinMarketData(
        AE_COINGECKO_COIN_ID,
        currentCurrencyCode.value,
      );

      aeternityData.value = {
        ...aeMarketData || {} as any,
        ...AE_TOKEN_BASE_DATA,
        convertedBalance: new BigNumber(0),
      };
    } catch (e) {
      handleUnknownError(e);
      aeternityData.value = undefined;
    }
  }

  function setCurrentCurrency(currency: CurrencyCode) {
    currentCurrencyCode.value = currency;
    loadAeternityData();
    setLocalStorageItem([LOCAL_STORAGE_CURRENCY_KEY], currency);
  }

  async function loadCurrencyRates() {
    isLoadingCurrencies.value = true;
    const fetchedCurrencyRates = await CoinGecko.fetchCoinCurrencyRates(getCoingeckoCoinIdList());

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
      navigator.language,
      { style: 'currency', currencyDisplay: 'narrowSymbol', currency: currentCurrencyCode.value },
    ).format(value);
  }

  /**
   * @param value Aeternity coin amount
   * @returns Aeternity coin converted to fiat
   */
  function getFiat(value: number): number {
    return +(currentCurrencyRate.value * value).toFixed(2);
  }

  /**
   * @param value Aeternity coin amount
   * @returns Aeternity coin converted to fiat and formatted as a currency
   *   according to the user's browser settings
   */
  function getFormattedFiat(value: number) {
    return formatCurrency(getFiat(value));
  }

  /**
   * Does the same as `getFormattedFiat` but avoids displaying small fractions
   * by rounding them to 0.01.
   * @param value Aeternity coin amount
   */
  function getFormattedAndRoundedFiat(value: number): string {
    if (!currentCurrencyRate.value || value === 0) {
      return formatCurrency(0);
    }
    const converted = getFiat(value);
    return (converted < 0.01) ? `<${formatCurrency(0.01)}` : formatCurrency(converted);
  }

  if (!withoutPolling) {
    initPollingWatcher(() => loadCurrencyRates());
  }

  watch(() => protocolsInUse.value, (currentValue, oldValue) => {
    if (difference(currentValue, oldValue).length && !isLoadingCurrencies.value) {
      loadCurrencyRates();
    }
  });

  return {
    aeternityData,
    CURRENCIES,
    minTipAmount,
    currencyRates,
    currentCurrencyCode,
    currentCurrencyRate,
    currentCurrencyInfo,
    loadAeternityData,
    loadCurrencyRates,
    setCurrentCurrency,
    formatCurrency,
    getFiat,
    getFormattedFiat,
    getFormattedAndRoundedFiat,
  };
}
