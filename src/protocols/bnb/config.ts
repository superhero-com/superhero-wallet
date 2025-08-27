import type { IDefaultNetworkTypeData } from '@/types';
import { NETWORK_TYPE_MAINNET, NETWORK_TYPE_TESTNET } from '@/constants';

export const BNB_PROTOCOL_NAME = 'BNB';

export const BNB_CONTRACT_ID = 'bnb';
export const BNB_COIN_SYMBOL = 'BNB';
export const BNB_COIN_PRECISION = 18;

export const BNB_COINGECKO_COIN_ID = 'binancecoin';
export const BNB_GAS_LIMIT = 21000;

/**
 * Estimated time we need to wait for the middleware (bscscan) to sync its state with the node
 */
export const BNB_MDW_TO_NODE_APPROX_DELAY_TIME = 30000;

export const BNB_NETWORK_DEFAULT_SETTINGS: IDefaultNetworkTypeData<any> = {
  [NETWORK_TYPE_MAINNET]: {
    nodeUrl: 'https://bsc-dataseed.binance.org/',
    chainId: '56',
  },
  [NETWORK_TYPE_TESTNET]: {
    nodeUrl: 'https://data-seed-prebsc-1-s1.binance.org:8545/',
    chainId: '97',
  },
};

export const BNB_NETWORK_ADDITIONAL_SETTINGS: IDefaultNetworkTypeData<any> = {
  [NETWORK_TYPE_MAINNET]: {
    explorerUrl: 'https://bscscan.com',
    middlewareUrl: 'https://api.etherscan.io/v2/api ',
    tokenMiddlewareUrl: '', // keep empty for now (skip token APIs)
  },
  [NETWORK_TYPE_TESTNET]: {
    explorerUrl: 'https://testnet.bscscan.com',
    middlewareUrl: 'https://api.etherscan.io/v2/api ',
    tokenMiddlewareUrl: '',
  },
};
