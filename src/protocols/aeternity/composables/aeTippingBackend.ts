import { useAeNetworkSettings } from '@/protocols/aeternity/composables/aeNetworkSettings';
import { fetchJson, postJson } from '@/utils';

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

  function getCacheChainNames() {
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
    getCacheChainNames,
    getCacheTip,
  };
}
