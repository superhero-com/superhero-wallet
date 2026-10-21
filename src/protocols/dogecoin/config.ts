import type { INetworkTypeProtocolDefaultSettings, IDefaultNetworkTypeData } from '@/types';
import { NETWORK_TYPE_MAINNET, NETWORK_TYPE_TESTNET } from '@/constants';

export const DOGE_CONTRACT_ID = 'dogecoin';
export const DOGE_SYMBOL = 'DOGE';
export const DOGE_PROTOCOL_NAME = 'Dogecoin';
export const DOGE_COIN_PRECISION = 8; // Amount of decimals
export const DOGE_COINGECKO_COIN_ID = 'dogecoin';

/**
 * Dogecoin Core's soft dust limit (0.01 DOGE): smaller outputs need an extra fee to relay.
 */
export const DOGE_DUST_AMOUNT = 1_000_000;
/**
 * Dogecoin Core's recommended fee rate (0.01 DOGE/kB) in koinu/vB.
 */
export const DOGE_DEFAULT_FEE_RATE = 1000;
/**
 * A 226 vB transaction (one input, two outputs) at `DOGE_DEFAULT_FEE_RATE`.
 */
export const DOGE_DEFAULT_FEE = 0.00226;

export const DOGE_NETWORK_DEFAULT_SETTINGS: INetworkTypeProtocolDefaultSettings = {
  [NETWORK_TYPE_MAINNET]: {
    nodeUrl: 'https://sochain.com/api/v2',
  },
  [NETWORK_TYPE_TESTNET]: { nodeUrl: 'https://doge-electrs-testnet-demo.qed.me' },
};

export const DOGE_NETWORK_ADDITIONAL_SETTINGS: IDefaultNetworkTypeData<any> = { // TODO - type
  [NETWORK_TYPE_MAINNET]: { explorerUrl: 'https://dogechain.info' },
  [NETWORK_TYPE_TESTNET]: { explorerUrl: 'https://doge-testnet-explorer.qed.me' },
};
