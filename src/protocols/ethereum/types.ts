import { INetworkProtocolSettings } from '@/types';

/**
 * Settings specific to this protocol.
 */
export type EthNetworkProtocolSettings = 'chainId';

export type IEthNetworkSettings = INetworkProtocolSettings<EthNetworkProtocolSettings>;

// Returned value have more fields, but they are not relevant for us
export interface EthRawToken {
  tokenInfo: {
    address: string;
    decimals: number;
  };
  rawBalance: string;
}
