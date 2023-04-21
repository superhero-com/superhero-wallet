/*
  eslint-disable
    camelcase,
    no-unused-vars,
*/

export interface CoinGeckoMarketResponse {
  ath: number;
  ath_change_percentage: number;
  ath_date: string;
  atl: number;
  atl_change_percentage: number;
  atl_date: string;
  circulating_supply: number;
  current_price: number;
  fully_diluted_valuation: any;
  high_24h: number;
  id: string;
  image: string;
  last_updated: string;
  low_24h: number;
  market_cap: number;
  market_cap_change_24h: number;
  market_cap_change_percentage_24h: number;
  market_cap_rank: number;
  max_supply: any;
  name: string;
  price_change_24h: number;
  price_change_percentage_24h: number;
  roi: object;
  symbol: string;
  total_supply: number;
  total_volume: number;
}
