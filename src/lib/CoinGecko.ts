import { CoinGeckoMarketResponse, CurrencyRates } from '../types';
import { CURRENCIES, fetchJson } from '../popup/utils';

const COIN_GECKO_API_URL = 'https://api.coingecko.com/api/v3';

/**
 * @link https://www.coingecko.com/pl/api/documentation
 */
export class CoinGecko {
  static fetchFromApi<T>(path: string, searchParams: Record<string, string>) {
    const query = (new URLSearchParams(searchParams)).toString();
    return fetchJson<T>(`${COIN_GECKO_API_URL}${path}?${query}`);
  }

  /**
   * Obtain all the coin market data (price, market cap, volume, etc...)
   */
  static async fetchCoinMarketData(
    coinId: string,
    currencyCode: string,
  ): Promise<CoinGeckoMarketResponse | null> {
    try {
      const [marketData] = (await CoinGecko.fetchFromApi<CoinGeckoMarketResponse[]>('/coins/markets', {
        ids: coinId,
        vs_currency: currencyCode,
      })) || [];
      return marketData || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Obtain all the coin rates for the currencies used in the app.
   */
  static async fetchCoinCurrencyRates(coinId: string): Promise<CurrencyRates | null> {
    try {
      return (await CoinGecko.fetchFromApi('/simple/price', {
        ids: coinId,
        vs_currencies: CURRENCIES.map(({ code }) => code).join(','),
      }) as any)[coinId];
    } catch (error) {
      return null;
    }
  }
}
