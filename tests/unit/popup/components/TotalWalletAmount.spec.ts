// @ts-nocheck
import { ref, nextTick } from 'vue';
import { mount } from '@vue/test-utils';

/**
 * Real `useCurrencies` with the rates restored from storage; only the accounts in use
 * and CoinGecko are mocked.
 */
const fetchCoinCurrencyRatesMock = vi.fn();

let protocolsInUseRef;
let wrapper;

async function mountWithRates(cachedRates, protocolsInUse, isMultisig = false) {
  vi.resetModules();
  localStorage.clear();
  protocolsInUseRef = ref(protocolsInUse);
  vi.doMock('@/composables/accounts', () => ({
    useAccounts: () => ({ protocolsInUse: protocolsInUseRef, isLoggedIn: ref(true) }),
  }));
  vi.doMock('@/lib/CoinGecko', () => ({
    CoinGecko: {
      fetchCoinMarketData: vi.fn().mockResolvedValue([]),
      fetchCoinCurrencyRates: fetchCoinCurrencyRatesMock,
    },
  }));
  // Seeded before `registerAdapters`, which loads the currencies store
  const { WalletStorage } = await import('@/lib/WalletStorage');
  WalletStorage.set('currency-rates', cachedRates);
  await import('@/protocols/registerAdapters');

  const { useCurrencies } = await import('@/composables/currencies');
  const { default: TotalWalletAmount } = await import('@/popup/components/TotalWalletAmount.vue');
  wrapper = mount(TotalWalletAmount, {
    props: { totalBalance: '12.34', isMultisig },
    global: { mocks: { $t: (key) => key } },
  });
  return useCurrencies({ pollingDisabled: true });
}

const getTotal = () => wrapper.find('.total-amount span').text();

describe('TotalWalletAmount', () => {
  afterEach(() => {
    wrapper?.unmount();
    fetchCoinCurrencyRatesMock.mockReset();
  });

  it('shows the total of the cached rates when CoinGecko fails', async () => {
    fetchCoinCurrencyRatesMock.mockResolvedValue(null);
    const { loadCurrencyRates, isCurrenciesUnavailable, formatCurrency } = await mountWithRates(
      { aeternity: { usd: 0.05 }, ethereum: { usd: 2000 } },
      ['aeternity', 'ethereum'],
    );

    await loadCurrencyRates();
    await nextTick();

    expect(isCurrenciesUnavailable.value).toBe(true);
    expect(getTotal()).toBe(formatCurrency(12.34));
  });

  it('shows no total when CoinGecko fails and a coin in use has no rate', async () => {
    fetchCoinCurrencyRatesMock.mockResolvedValue(null);
    const { loadCurrencyRates, noCurrencyRateFiat } = await mountWithRates(
      { aeternity: { usd: 0.05 } },
      ['aeternity', 'ethereum'],
    );

    await loadCurrencyRates();
    await nextTick();

    expect(getTotal()).toBe(noCurrencyRateFiat.value);
  });

  it('shows the multisig total when CoinGecko fails and only another coin has no rate', async () => {
    fetchCoinCurrencyRatesMock.mockResolvedValue(null);
    const { loadCurrencyRates, formatCurrency } = await mountWithRates(
      { aeternity: { usd: 0.05 } },
      ['aeternity', 'ethereum'],
      true,
    );

    await loadCurrencyRates();
    await nextTick();

    expect(getTotal()).toBe(formatCurrency(12.34));
  });

  it('shows the total when CoinGecko answers', async () => {
    fetchCoinCurrencyRatesMock.mockResolvedValue({
      aeternity: { usd: 0.05 },
      ethereum: { usd: 2000 },
    });
    const { loadCurrencyRates, isCurrenciesUnavailable, formatCurrency } = await mountWithRates(
      {},
      ['aeternity', 'ethereum'],
    );

    await loadCurrencyRates();
    await nextTick();

    expect(isCurrenciesUnavailable.value).toBe(false);
    expect(getTotal()).toBe(formatCurrency(12.34));
  });
});
