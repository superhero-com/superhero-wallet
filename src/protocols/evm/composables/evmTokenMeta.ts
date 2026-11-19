import type { Protocol } from '@/types';
import { useFungibleTokens } from '@/composables/fungibleTokens';
import { getEvmTokenMeta, type IEvmTokenMeta } from '@/protocols/evm/helpers/evmAddressInfo';

/** By node and contract; only whole answers are kept, as a failing node tells no token or symbol */
const cache = new Map<string, Promise<IEvmTokenMeta>>();

export function clearEvmTokenMetaCache() {
  cache.clear();
}

/** Token details from the wallet's token list, or else from the chain's node */
export function useEvmTokenMeta(protocol: Protocol) {
  const { getProtocolAvailableTokens } = useFungibleTokens();

  function getKnownToken(address: string): IEvmTokenMeta | undefined {
    const token = Object.values(getProtocolAvailableTokens(protocol) ?? {})
      .find(({ contractId }) => contractId?.toLowerCase() === address.toLowerCase());
    return (token && Number.isInteger(token.decimals))
      ? { symbol: token.symbol, decimals: token.decimals }
      : undefined;
  }

  async function getTokenMeta(nodeUrl: string, address: string): Promise<IEvmTokenMeta> {
    const known = getKnownToken(address);
    if (known) return known;
    const key = `${nodeUrl}|${address.toLowerCase()}`;
    if (!cache.has(key)) {
      cache.set(key, getEvmTokenMeta(nodeUrl, address).then(
        (meta) => {
          if (meta.symbol === undefined || (meta.decimals === undefined && !meta.isNft)) {
            cache.delete(key);
          }
          return meta;
        },
        (error) => {
          cache.delete(key);
          throw error;
        },
      ));
    }
    return cache.get(key)!;
  }

  return { getTokenMeta };
}
