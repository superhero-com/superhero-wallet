import type { IDefaultNetworkTypeData } from '@/types';
import { NETWORK_TYPE_MAINNET, NETWORK_TYPE_TESTNET } from '@/constants';

export const AVALANCHE_PROTOCOL_NAME = 'Avalanche';

export const AVALANCHE_CONTRACT_ID = 'avalanche';
export const AVALANCHE_COIN_SYMBOL = 'AVAX';
export const AVALANCHE_COIN_PRECISION = 18;

export const AVALANCHE_COINGECKO_COIN_ID = 'avalanche-2';
export const AVALANCHE_GAS_LIMIT = 21000;

/**
 * Estimated time we need to wait for the middleware (snowtrace) to sync its state with the node
 */
export const AVALANCHE_MDW_TO_NODE_APPROX_DELAY_TIME = 30000;

export const AVALANCHE_NETWORK_DEFAULT_SETTINGS: IDefaultNetworkTypeData<any> = {
  [NETWORK_TYPE_MAINNET]: {
    nodeUrl: 'https://api.avax.network/ext/bc/C/rpc',
    chainId: '43114',
  },
  [NETWORK_TYPE_TESTNET]: {
    nodeUrl: 'https://api.avax-test.network/ext/bc/C/rpc',
    chainId: '43113',
  },
};

export const AVALANCHE_NETWORK_ADDITIONAL_SETTINGS: IDefaultNetworkTypeData<any> = {
  [NETWORK_TYPE_MAINNET]: {
    explorerUrl: 'https://snowtrace.io',
    middlewareUrl: 'https://api.snowtrace.io/api',
    tokenMiddlewareUrl: '', // keep empty for now (skip token APIs)
  },
  [NETWORK_TYPE_TESTNET]: {
    explorerUrl: 'https://testnet.snowtrace.io',
    middlewareUrl: 'https://api-testnet.snowtrace.io/api',
    tokenMiddlewareUrl: '',
  },
};
