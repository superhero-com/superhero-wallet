import type { IDefaultNetworkTypeData } from '@/types';
import { NETWORK_TYPE_MAINNET, NETWORK_TYPE_TESTNET } from '@/constants';

export const SOL_PROTOCOL_NAME = 'Solana';

export const SOL_CONTRACT_ID = 'solana';

export const SOL_COIN_SYMBOL = 'SOL';
export const SOL_COIN_PRECISION = 18; // Amount of decimals

export const SOL_COINGECKO_COIN_ID = 'solana';

export const SOL_NETWORK_DEFAULT_SETTINGS: IDefaultNetworkTypeData = {
  [NETWORK_TYPE_MAINNET]: {
    nodeUrl: 'https://go.getblock.io/a9583f344e9e41e8a178738568430238', // TODO find working node API
  },
  [NETWORK_TYPE_TESTNET]: {
    nodeUrl: 'https://api.testnet.solana.com', // TODO replace temp values - use our own node
  },
};

export const SOL_NETWORK_DEFAULT_ENV_SETTINGS = (process.env.NETWORK === 'Testnet')
  ? SOL_NETWORK_DEFAULT_SETTINGS[NETWORK_TYPE_TESTNET]
  : SOL_NETWORK_DEFAULT_SETTINGS[NETWORK_TYPE_MAINNET];
