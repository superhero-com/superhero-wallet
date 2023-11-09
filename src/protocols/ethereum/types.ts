import { INetworkProtocolSettings } from '@/types';

/**
 * Settings specific to this protocol.
 */
export type EthNetworkProtocolSettings = 'chainId';

export type IEthNetworkSettings = INetworkProtocolSettings<EthNetworkProtocolSettings>;
