import type { INetworkTypeProtocolDefaultSettings, IDefaultNetworkTypeData } from '@/types';
import { NETWORK_TYPE_MAINNET, NETWORK_TYPE_TESTNET } from '@/constants';

export const ETH_CONTRACT_ID = 'ethereum';
export const ETH_SYMBOL = 'ETH';
export const ETH_COIN_NAME = 'Ethereum';
export const ETH_PROTOCOL_NAME = 'Ethereum';
export const ETH_COIN_PRECISION = 18; // Amount of decimals
export const ETH_COINGECKO_COIN_ID = 'ethereum';

export const ETH_NETWORK_DEFAULT_SETTINGS: INetworkTypeProtocolDefaultSettings = {
  [NETWORK_TYPE_MAINNET]: {
    nodeUrl: 'https://eth.llamarpc.com', // TODO replace temp values - use our own node
  },
  [NETWORK_TYPE_TESTNET]: {
    nodeUrl: 'https://ethereum-goerli.publicnode.com', // TODO replace temp values - use our own node also goerli will be deprecated EOY 2023
  },
};

export const ETH_NETWORK_ADDITIONAL_SETTINGS: IDefaultNetworkTypeData<any> = { // TODO - type
  [NETWORK_TYPE_MAINNET]: {
    explorerUrl: 'https://etherscan.io/', // TODO replace temp values
  },
  [NETWORK_TYPE_TESTNET]: {
    explorerUrl: 'https://goerli.etherscan.io/', // TODO replace temp values
  },
};
