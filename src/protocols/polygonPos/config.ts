import type { IDefaultNetworkTypeData } from '@/types';
import { ALCHEMY_API_KEY, NETWORK_TYPE_MAINNET, NETWORK_TYPE_TESTNET } from '@/constants';

export const POLYGON_POS_PROTOCOL_NAME = 'Polygon PoS';

export const POLYGON_POS_CONTRACT_ID = 'polygon';
export const POLYGON_POS_COIN_SYMBOL = 'POL';
export const POLYGON_POS_COIN_PRECISION = 18;

export const POLYGON_POS_COINGECKO_COIN_ID = 'polygon';
export const POLYGON_POS_GAS_LIMIT = 21000;

/** Estimated time we need to wait for the middleware to sync with node */
export const POLYGON_MDW_TO_NODE_APPROX_DELAY_TIME = 30000;

export const POLYGON_NETWORK_DEFAULT_SETTINGS: IDefaultNetworkTypeData<any> = {
  [NETWORK_TYPE_MAINNET]: {
    nodeUrl: 'https://polygon-rpc.com',
    chainId: '137',
  },
  [NETWORK_TYPE_TESTNET]: {
    nodeUrl: 'https://rpc-amoy.polygon.technology/',
    chainId: '80002',
  },
};
export const POLYGON_NETWORK_ADDITIONAL_SETTINGS: IDefaultNetworkTypeData<any> = {
  [NETWORK_TYPE_MAINNET]: {
    explorerUrl: 'https://polygonscan.com',
    middlewareUrl: 'https://api.etherscan.io/v2/api ',
    tokenMiddlewareUrl: 'https://api.ethplorer.io',
  },
  [NETWORK_TYPE_TESTNET]: {
    explorerUrl: 'https://amoy.polygonscan.com',
    middlewareUrl: 'https://api.etherscan.io/v2/api ',
    tokenMiddlewareUrl: `https://polygon-amoy.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
  },
};
