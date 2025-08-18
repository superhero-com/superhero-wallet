import type { INetworkTypeProtocolDefaultSettings } from '@/types';
import {
  ALCHEMY_API_KEY,
  NETWORK_TYPE_MAINNET,
  NETWORK_TYPE_TESTNET,
} from '@/constants';

export const SOL_PROTOCOL_NAME = 'Solana';

export const SOL_CONTRACT_ID = 'solana';

export const SOL_COIN_SYMBOL = 'SOL';
export const SOL_COIN_PRECISION = 9; // Amount of decimals

export const SOL_COINGECKO_COIN_ID = 'solana';

export const SOL_MDW_TO_NODE_APPROX_DELAY_TIME = 0;

export const SOL_TOKEN_LIST_URL = 'https://raw.githubusercontent.com/solana-labs/token-list/main/src/tokens/solana.tokenlist.json';

// SPL Token Program ID (base58)
export const SOL_TOKEN_PROGRAM_ID = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';

export const SOL_NETWORK_DEFAULT_SETTINGS: INetworkTypeProtocolDefaultSettings<'explorerUrl'> = {
  [NETWORK_TYPE_MAINNET]: {
    nodeUrl: `https://solana-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    explorerUrl: 'https://explorer.solana.com',
  },
  [NETWORK_TYPE_TESTNET]: {
    nodeUrl: 'https://api.testnet.solana.com',
    explorerUrl: 'https://explorer.solana.com?cluster=testnet',
  },
};

export const SOL_NETWORK_DEFAULT_ENV_SETTINGS = (process.env.NETWORK === 'Testnet')
  ? SOL_NETWORK_DEFAULT_SETTINGS[NETWORK_TYPE_MAINNET]
  : SOL_NETWORK_DEFAULT_SETTINGS[NETWORK_TYPE_TESTNET];
