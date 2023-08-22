import type { INetworkTypeProtocolDefaultSettings } from '@/types';
import { NETWORK_TYPE_MAINNET, NETWORK_TYPE_TESTNET } from '@/constants';

export const BTC_CONTRACT_ID = 'bitcoin';
export const BTC_SYMBOL = 'BTC';
export const BTC_COIN_NAME = 'Bitcoin';
export const BTC_COIN_PRECISION = 8; // Amount of decimals
export const BTC_COINGECKO_COIN_ID = 'bitcoin';

export const BTC_NETWORK_DEFAULT_SETTINGS: INetworkTypeProtocolDefaultSettings = {
  [NETWORK_TYPE_MAINNET]: {
    nodeUrl: 'https://blockstream.info/api',
  },
  [NETWORK_TYPE_TESTNET]: {
    nodeUrl: 'https://blockstream.info/testnet/api',
  },
};
