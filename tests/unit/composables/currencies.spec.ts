// @ts-nocheck
import { ref, nextTick } from 'vue';

/**
 * `useCurrencies` now only needs two mocks: `useAccounts` (to control which protocols
 * are "in use" and whether the user is logged in) and `@/lib/CoinGecko` (the actual
 * network boundary). Everything else - `useStorageRef`, `ProtocolAdapterFactory`
 * (for `coinGeckoCoinId`), `Intl.NumberFormat` - runs for real.
 */
const fetchCoinMarketDataMock = vi.fn();
const fetchCoinCurrencyRatesMock = vi.fn();

let protocolsInUseRef;
let isLoggedInRef;

function flushPromises() {
  return new Promise((resolve) => { setTimeout(resolve, 0); });
}

describe('useCurrencies', () => {
  beforeEach(async () => {
    vi.resetModules();
    localStorage.clear();
    fetchCoinMarketDataMock.mockReset().mockResolvedValue([]);
    fetchCoinCurrencyRatesMock.mockReset().mockResolvedValue({});

    protocolsInUseRef = ref(['aeternity']);
    isLoggedInRef = ref(true);

    // Must be registered before `registerAdapters` is imported: it transitively loads
    // the real `accounts` composable (via aeSdk.ts -> accounts.ts -> the `@/composables`
    // barrel), so mocking it afterwards would be too late for this module generation.
    vi.doMock('@/composables/accounts', () => ({
      useAccounts: () => ({
        protocolsInUse: protocolsInUseRef,
        isLoggedIn: isLoggedInRef,
      }),
    }));
    vi.doMock('@/lib/CoinGecko', () => ({
      CoinGecko: {
        fetchCoinMarketData: fetchCoinMarketDataMock,
        fetchCoinCurrencyRates: fetchCoinCurrencyRatesMock,
      },
    }));

    await import('@/protocols/registerAdapters');
  });

  it('returns a 0 rate for a protocol with no fetched data yet', async () => {
    const { useCurrencies } = await import('@/composables/currencies');
    const { getCurrentCurrencyRate } = useCurrencies({ pollingDisabled: true });

    expect(getCurrentCurrencyRate('aeternity')).toBe(0);
  });

  it('loadCurrencyRates fetches by the coingecko ids of protocols in use and stores the rate', async () => {
    fetchCoinCurrencyRatesMock.mockResolvedValue({ aeternity: { usd: 0.05, eur: 0.04 } });

    const { useCurrencies } = await import('@/composables/currencies');
    const { loadCurrencyRates, getCurrentCurrencyRate, currentCurrencyCode } = useCurrencies({
      pollingDisabled: true,
    });
    currentCurrencyCode.value = 'usd';

    await loadCurrencyRates();

    expect(fetchCoinCurrencyRatesMock).toHaveBeenCalledWith('aeternity');
    expect(getCurrentCurrencyRate('aeternity')).toBe(0.05);
  });

  it('preserves a protocol previous rate when a later fetch omits it', async () => {
    fetchCoinCurrencyRatesMock.mockResolvedValueOnce({ aeternity: { usd: 0.05 } });

    const { useCurrencies } = await import('@/composables/currencies');
    const { loadCurrencyRates, getCurrentCurrencyRate } = useCurrencies({ pollingDisabled: true });

    await loadCurrencyRates();
    expect(getCurrentCurrencyRate('aeternity')).toBe(0.05);

    fetchCoinCurrencyRatesMock.mockResolvedValueOnce({});
    await loadCurrencyRates();

    expect(getCurrentCurrencyRate('aeternity')).toBe(0.05);
  });

  it('setCurrentCurrency switches the currency code and reloads coin market data once logged in', async () => {
    fetchCoinMarketDataMock.mockResolvedValue([{ id: 'aeternity', currentPrice: 0.1 }]);

    const { useCurrencies } = await import('@/composables/currencies');
    const { setCurrentCurrency, currentCurrencyCode, marketData } = useCurrencies({
      pollingDisabled: true,
    });

    setCurrentCurrency('eur');
    await flushPromises();

    expect(currentCurrencyCode.value).toBe('eur');
    expect(fetchCoinMarketDataMock).toHaveBeenCalledWith('aeternity', 'eur');
    expect(marketData.value.aeternity.currentPrice).toBe(0.1);
  });

  it('formats fiat values, falling back to "no rate" and rounding tiny fractions to <0.01', async () => {
    fetchCoinCurrencyRatesMock.mockResolvedValue({ aeternity: { usd: 2 } });

    const { useCurrencies } = await import('@/composables/currencies');
    const {
      loadCurrencyRates, getFormattedFiat, getFormattedAndRoundedFiat, noCurrencyRateFiat,
    } = useCurrencies({ pollingDisabled: true });

    // Before any rate is loaded, formatted fiat falls back to the "no rate" placeholder.
    expect(getFormattedFiat(10, 'aeternity')).toBe(noCurrencyRateFiat.value);

    await loadCurrencyRates();

    expect(getFormattedFiat(10, 'aeternity')).toContain('20.00');
    // 0.001 AE * 2 USD = 0.002, below the 1 cent threshold.
    expect(getFormattedAndRoundedFiat(0.001, 'aeternity')).toMatch(/^</);
    expect(getFormattedAndRoundedFiat(0, 'aeternity')).toContain('0.00');
  });

  it('automatically reloads rates when a new protocol is added to protocolsInUse', async () => {
    fetchCoinCurrencyRatesMock.mockResolvedValue({});

    const { useCurrencies } = await import('@/composables/currencies');
    useCurrencies({ pollingDisabled: true });

    protocolsInUseRef.value = ['aeternity', 'ethereum'];
    await nextTick();
    await flushPromises();

    expect(fetchCoinCurrencyRatesMock).toHaveBeenCalledWith('aeternity,ethereum');
  });
});
