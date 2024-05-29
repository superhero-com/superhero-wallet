import type { INetworkTypeProtocolDefaultSettings, IDefaultNetworkTypeData } from '@/types';
import { NETWORK_TYPE_MAINNET, NETWORK_TYPE_TESTNET } from '@/constants';

export const BTC_CONTRACT_ID = 'bitcoin';
export const BTC_SYMBOL = 'BTC';
export const BTC_PROTOCOL_NAME = 'Bitcoin';
export const BTC_COIN_PRECISION = 8; // Amount of decimals
export const BTC_COINGECKO_COIN_ID = 'bitcoin';
/**
 * Lower cap is 294 for segwit transactions and 546 upper cap for non-segwit transactions
 * https://github.com/bitcoin/bitcoin/blob/25.x/src/policy/policy.cpp#L36C1-L36C1
 */
export const DUST_AMOUNT = 546;

export const BTC_NETWORK_DEFAULT_SETTINGS: INetworkTypeProtocolDefaultSettings = {
  [NETWORK_TYPE_MAINNET]: {
    nodeUrl: 'https://blockstream.info/api',
  },
  [NETWORK_TYPE_TESTNET]: {
    nodeUrl: 'https://blockstream.info/testnet/api',
  },
};

export const BTC_NETWORK_ADDITIONAL_SETTINGS: IDefaultNetworkTypeData<any> = { // TODO - type
  [NETWORK_TYPE_MAINNET]: {
    explorerUrl: 'https://blockstream.info',
  },
  [NETWORK_TYPE_TESTNET]: {
    explorerUrl: 'https://blockstream.info/testnet',
  },
};
