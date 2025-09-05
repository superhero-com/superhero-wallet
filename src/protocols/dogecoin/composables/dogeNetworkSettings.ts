import { computed } from 'vue';
import type { NetworkTypeDefault } from '@/types';
import { NETWORK_TYPE_CUSTOM, NETWORK_TYPE_TESTNET, PROTOCOLS } from '@/constants';
import { useNetworks } from '@/composables/networks';
import { DOGE_NETWORK_ADDITIONAL_SETTINGS } from '@/protocols/dogecoin/config';

export function useDogeNetworkSettings() {
  const { activeNetwork, activeNetworkName } = useNetworks();

  const dogeActiveNetworkSettings = computed(() => (
    (activeNetwork.value.protocols as any)[PROTOCOLS.dogecoin] as any // TODO - type doge network
  ));

  const dogeActiveNetworkPredefinedSettings = computed((): any => { // TODO - type
    const networkType: NetworkTypeDefault = (activeNetwork.value.type === NETWORK_TYPE_CUSTOM)
      ? NETWORK_TYPE_TESTNET
      : activeNetwork.value.type;
    return DOGE_NETWORK_ADDITIONAL_SETTINGS[networkType] || {};
  });

  return {
    activeNetworkName,
    dogeActiveNetworkSettings,
    dogeActiveNetworkPredefinedSettings,
  };
}
