import { INetworkProtocolSettings } from '@/types';

/**
 * Settings specific to this protocol.
 */
export type EthNetworkProtocolSettings =
  | 'chainId'; // ref: https://docs.simplehash.com/reference/supported-chains-testnets

/**
 * Settings that are not editable by the user but are assigned to specific network types.
 */
export type EthNetworkProtocolPredefinedSettings =
  | 'explorerUrl'
  | 'middlewareUrl'
  | 'tokenMiddlewareUrl'; // EthplorerService

export type IEthNetworkSettings = INetworkProtocolSettings<EthNetworkProtocolSettings>;

export type IEthNetworkPredefinedSettings = Record<EthNetworkProtocolPredefinedSettings, string>;
