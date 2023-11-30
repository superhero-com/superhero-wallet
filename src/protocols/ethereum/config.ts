import type { IDefaultNetworkTypeData } from '@/types';
import { NETWORK_TYPE_MAINNET, NETWORK_TYPE_TESTNET } from '@/constants';
import type { IEthNetworkPredefinedSettings, IEthNetworkSettings } from './types';

export const ETH_CONTRACT_ID = 'ethereum';
export const ETH_CONTRACT_ID_EXTERNAL = '0x0000000000000000000000000000000000000000';
export const ETH_SYMBOL = 'ETH';
export const ETH_COIN_NAME = 'Ethereum';
export const ETH_PROTOCOL_NAME = 'Ethereum';
export const ETH_COIN_PRECISION = 18; // Amount of decimals
export const ETH_COINGECKO_COIN_ID = 'ethereum';
export const ETH_GAS_LIMIT = 21000;

/**
 * Amount of confirmations to consider transaction safe & not pending
 */
export const ETH_SAFE_CONFIRMATION_COUNT = 12;

export const ETH_NETWORK_DEFAULT_SETTINGS: IDefaultNetworkTypeData<IEthNetworkSettings> = {
  [NETWORK_TYPE_MAINNET]: {
    nodeUrl: 'https://ethereum.publicnode.com', // TODO replace temp values - use our own node
    chainId: '0x1',
  },
  [NETWORK_TYPE_TESTNET]: {
    nodeUrl: 'https://ethereum-sepolia.publicnode.com', // TODO replace temp values - use our own node
    chainId: '0xaa36a7',
  },
};

export const ETH_NETWORK_ADDITIONAL_SETTINGS: IDefaultNetworkTypeData<
  IEthNetworkPredefinedSettings
> = {
  [NETWORK_TYPE_MAINNET]: {
    explorerUrl: 'https://etherscan.io',
    middlewareUrl: 'https://api.etherscan.io/api', // TODO replace temp values
    tokenMiddlewareUrl: 'https://api.ethplorer.io',
  },
  [NETWORK_TYPE_TESTNET]: {
    explorerUrl: 'https://sepolia.etherscan.io',
    middlewareUrl: 'https://api-sepolia.etherscan.io/api', // TODO replace temp values
    tokenMiddlewareUrl: 'https://sepolia-api.ethplorer.io',
  },
};

export const ETH_NETWORK_DEFAULT_ENV_SETTINGS = (process.env.NETWORK === 'Testnet')
  ? ETH_NETWORK_DEFAULT_SETTINGS[NETWORK_TYPE_MAINNET]
  : ETH_NETWORK_DEFAULT_SETTINGS[NETWORK_TYPE_TESTNET];
