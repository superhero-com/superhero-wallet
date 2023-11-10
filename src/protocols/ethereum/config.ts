import type { IDefaultNetworkTypeData } from '@/types';
import { NETWORK_TYPE_MAINNET, NETWORK_TYPE_TESTNET } from '@/constants';
import type { IEthNetworkSettings } from './types';

export const ETH_CONTRACT_ID = 'ethereum';
export const ETH_SYMBOL = 'ETH';
export const ETH_COIN_NAME = 'Ethereum';
export const ETH_PROTOCOL_NAME = 'Ethereum';
export const ETH_COIN_PRECISION = 18; // Amount of decimals
export const ETH_COINGECKO_COIN_ID = 'ethereum';

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

export const ETH_NETWORK_ADDITIONAL_SETTINGS: IDefaultNetworkTypeData<any> = { // TODO - type
  [NETWORK_TYPE_MAINNET]: {
    explorerUrl: 'https://etherscan.io/', // TODO replace temp values
  },
  [NETWORK_TYPE_TESTNET]: {
    explorerUrl: 'https://sepolia.etherscan.io/', // TODO replace temp values
  },
};
