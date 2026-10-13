import type { IEthRpcMethodParameters } from '@/protocols/ethereum/types';
import { ETH_RPC_ETHERSCAN_PROXY_METHODS, ETH_RPC_METHODS } from '@/protocols/ethereum/config';

/**
 * Map the positional EIP-1193 `params` to the named ones `handleEvmRpcMethod` expects.
 */
export function toEvmRpcParams(method: string, params?: any[]): IEthRpcMethodParameters {
  switch (method) {
    case ETH_RPC_METHODS.getBalance:
      return { address: params?.[0] };
    case ETH_RPC_METHODS.signPersonal:
      return { data: params?.[0] };
    case ETH_RPC_ETHERSCAN_PROXY_METHODS.getTransactionByHash:
    case ETH_RPC_ETHERSCAN_PROXY_METHODS.getTransactionReceipt:
      return { txhash: params?.[0] };
    case ETH_RPC_ETHERSCAN_PROXY_METHODS.getBlockByNumber:
      return { tag: params?.[0], boolean: params?.[1] };
    case ETH_RPC_ETHERSCAN_PROXY_METHODS.getUncleByBlockNumberAndIndex:
      return { tag: params?.[0], index: params?.[1] };
    default:
      return {
        ...(params?.[0] || {}),
        ...(params?.[1] && !params?.[0]?.tag ? { tag: params[1] } : {}),
      };
  }
}
