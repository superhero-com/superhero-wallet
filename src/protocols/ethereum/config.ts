import { ContractAbi } from 'web3-types';

import type { IDefaultNetworkTypeData } from '@/types';
import { NETWORK_TYPE_MAINNET, NETWORK_TYPE_TESTNET } from '@/constants';
import type { IEthNetworkPredefinedSettings, IEthNetworkSettings } from './types';

export const ETH_PROTOCOL_NAME = 'Ethereum';

export const ETH_CONTRACT_ID = 'ethereum';
export const ETH_CONTRACT_ID_EXTERNAL = '0x0000000000000000000000000000000000000000';

export const ETH_COIN_NAME = 'Ethereum';
export const ETH_COIN_SYMBOL = 'ETH';
export const ETH_COIN_PRECISION = 18; // Amount of decimals

export const ETH_COINGECKO_COIN_ID = 'ethereum';
export const ETH_GAS_LIMIT = 21000;
export const ETH_CHAIN_NAMESPACE = 'eip155';

/**
 * Estimated time we need to wait for the middleware (etherscan) to sync it's state
 * with the node. There is a high risk that in some cases this won't be enough
 * so consider using this constant as a workaround.
 */
export const ETH_MDW_TO_NODE_APPROX_DELAY_TIME = 30000;

export const ERC20_ABI: ContractAbi = [
  {
    constant: true,
    inputs: [],
    name: 'decimals',
    outputs: [
      {
        name: '',
        type: 'uint8',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      {
        name: '_to',
        type: 'address',
      },
      {
        name: '_value',
        type: 'uint256',
      },
    ],
    name: 'transfer',
    outputs: [
      {
        name: '',
        type: 'bool',
      },
    ],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
];

/**
 * Amount of confirmations to consider transaction safe & not pending
 */
export const ETH_SAFE_CONFIRMATION_COUNT = 12;

export const ETH_NETWORK_DEFAULT_SETTINGS: IDefaultNetworkTypeData<IEthNetworkSettings> = {
  [NETWORK_TYPE_MAINNET]: {
    nodeUrl: 'https://ethereum-rpc.publicnode.com', // TODO replace temp values - use our own node
    chainId: '1',
  },
  [NETWORK_TYPE_TESTNET]: {
    nodeUrl: 'https://ethereum-sepolia-rpc.publicnode.com', // TODO replace temp values - use our own node
    chainId: '11155111',
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
