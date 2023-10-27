import { Encoded } from '@aeternity/aepp-sdk';
import type { ChainName } from '@/types';
import { fetchJson, postJson } from '@/utils';
import { useAeNetworkSettings } from '@/protocols/aeternity/composables/aeNetworkSettings';

export function useAeTippingBackend() {
  const { aeActiveNetworkSettings } = useAeNetworkSettings();
  const { backendUrl } = aeActiveNetworkSettings.value;

  function claimTips(url: string, address: string) {
    return postJson(`${backendUrl}/claim/submit`, { body: { url, address } });
  }

  function cacheInvalidateOracle() {
    return fetchJson(`${backendUrl}/cache/invalidate/oracle`);
  }

  function cacheInvalidateTips() {
    return fetchJson(`${backendUrl}/cache/invalidate/tips`);
  }

  function donateError(error: Record<string, any>) {
    return postJson(`${backendUrl}/errorreport`, { body: error });
  }

  function fetchCachedChainNames(): Promise<Record<Encoded.AccountAddress, ChainName> | null> {
    return fetchJson(`${backendUrl}/cache/chainnames`);
  }

  function getCacheTip(id: string) {
    return fetchJson(`${backendUrl}/tips/single/${id}`);
  }

  return {
    claimTips,
    cacheInvalidateOracle,
    cacheInvalidateTips,
    donateError,
    fetchCachedChainNames,
    getCacheTip,
  };
}
