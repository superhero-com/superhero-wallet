import type { Dictionary, INetworkProtocolSettings, ObjectValues } from '@/types';
import { ETH_RPC_ETHERSCAN_PROXY_METHODS, ETH_RPC_METHODS, ETH_RPC_WALLET_EVENTS } from '@/protocols/ethereum/config';

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

export interface EthDecodedCallData {
  functionName: string;
  args: Dictionary;
}

/** All method params are encoded */
export interface IEthRpcMethodParameters {
  address?: string;
  to?: string;
  from?: string;
  data?: string;
  gas?: string;
  tag?: string;
  value?: string;
  chainId?: string;
  result?: string;
}

export type EthRpcMethod = ObjectValues<typeof ETH_RPC_METHODS>;
export type EthRpcEtherscanProxyMethod = ObjectValues<typeof ETH_RPC_ETHERSCAN_PROXY_METHODS>;
export type ETHRpcWalletEvents = ObjectValues<typeof ETH_RPC_WALLET_EVENTS>;
export type EthRpcSupportedMethods = EthRpcMethod | EthRpcEtherscanProxyMethod | ETHRpcWalletEvents;
