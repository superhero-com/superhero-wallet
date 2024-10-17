import { ref } from 'vue';
import { Encoded } from '@aeternity/aepp-sdk';

import type { ChainName } from '@/types';
import type { BackendHealth } from '@/protocols/aeternity/types';
import { fetchJson, postJson } from '@/utils';
import { useAeNetworkSettings } from '@/protocols/aeternity/composables/aeNetworkSettings';
import { createPollingBasedOnMountedComponents } from '@/composables/composablesHelpers';
import { UNFINISHED_FEATURES } from '@/constants';

const POLLING_INTERVAL = 15000;

const initPollingWatcher = createPollingBasedOnMountedComponents(POLLING_INTERVAL);

const isBackendUnavailable = ref(false);

export function useAeTippingBackend() {
  const { aeActiveNetworkSettings } = useAeNetworkSettings();
  const { backendUrl } = aeActiveNetworkSettings.value;

  async function checkBackendStatus() {
    try {
      const backendStatus = await Promise.race(
        [fetchJson(`${backendUrl}/health/backend`),
          new Promise((_r, reject) => setTimeout(reject, POLLING_INTERVAL)),
        ],
      ) as BackendHealth;
      isBackendUnavailable.value = !(
        backendStatus.dbHealth && backendStatus.aeHealth && backendStatus.redisHealth
      );
    } catch (e) {
      isBackendUnavailable.value = true;
    }
  }

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

  // Temporary disable backend status check, due to backend issues
  if (UNFINISHED_FEATURES) {
    initPollingWatcher(() => checkBackendStatus());
  }

  return {
    isBackendUnavailable,
    claimTips,
    cacheInvalidateOracle,
    cacheInvalidateTips,
    donateError,
    fetchCachedChainNames,
    getCacheTip,
  };
}
