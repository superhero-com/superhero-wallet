import { isPlainObject } from 'lodash-es';
import type { IEthRpcMethodParameters } from '@/protocols/ethereum/types';
import { ETH_RPC_METHODS } from '@/protocols/ethereum/config';

/**
 * Map the positional EIP-1193 `params` to the named ones `handleEvmRpcMethod` expects.
 */
export function toEvmRpcParams(method: string, params?: any[]): IEthRpcMethodParameters {
  switch (method) {
    case ETH_RPC_METHODS.getBalance:
      return { address: params?.[0] };
    case ETH_RPC_METHODS.signPersonal:
      return { data: params?.[0] };
    case ETH_RPC_METHODS.signTypedDataV4:
      return {
        address: params?.[0],
        // Some dapps send the typed data as an object instead of a JSON string
        data: typeof params?.[1] === 'string' ? params[1] : JSON.stringify(params?.[1]),
      };
    default:
      // e.g. the transaction of `eth_sendTransaction`
      return isPlainObject(params?.[0]) ? params![0] : {};
  }
}
