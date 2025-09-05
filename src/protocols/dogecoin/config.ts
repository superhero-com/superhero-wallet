import type { INetworkTypeProtocolDefaultSettings, IDefaultNetworkTypeData } from '@/types';
import { NETWORK_TYPE_MAINNET, NETWORK_TYPE_TESTNET } from '@/constants';

export const DOGE_CONTRACT_ID = 'dogecoin';
export const DOGE_SYMBOL = 'DOGE';
export const DOGE_PROTOCOL_NAME = 'Dogecoin';
export const DOGE_COIN_PRECISION = 8; // Amount of decimals
export const DOGE_COINGECKO_COIN_ID = 'dogecoin';

export const DOGE_NETWORK_DEFAULT_SETTINGS: INetworkTypeProtocolDefaultSettings = {
  [NETWORK_TYPE_MAINNET]: {
    nodeUrl: 'https://sochain.com/api/v2',
  },
  [NETWORK_TYPE_TESTNET]: { nodeUrl: 'https://doge-electrs-testnet-demo.qed.me' },
};

export const DOGE_NETWORK_ADDITIONAL_SETTINGS: IDefaultNetworkTypeData<any> = { // TODO - type
  [NETWORK_TYPE_MAINNET]: { explorerUrl: 'https://dogechain.info' },
  [NETWORK_TYPE_TESTNET]: { explorerUrl: 'https://doge-testnet-explorer.qed.me' },
};
