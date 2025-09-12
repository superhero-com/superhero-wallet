import { computed } from 'vue';
import type { NetworkTypeDefault } from '@/types';
import {
  NETWORK_TYPE_CUSTOM,
  NETWORK_TYPE_TESTNET,
  PROTOCOLS,
} from '@/constants';
import { useNetworks } from '@/composables/networks';
import { AVALANCHE_NETWORK_ADDITIONAL_SETTINGS } from '../config';

export function useAvalancheNetworkSettings() {
  const { activeNetwork, activeNetworkName } = useNetworks();

  const avalancheActiveNetworkSettings = computed(
    () => activeNetwork.value.protocols[PROTOCOLS.avalanche] as any,
  );

  const avalancheActiveNetworkPredefinedSettings = computed(() => {
    const networkType: NetworkTypeDefault = activeNetwork.value.type === NETWORK_TYPE_CUSTOM
      ? NETWORK_TYPE_TESTNET
      : activeNetwork.value.type;
    return AVALANCHE_NETWORK_ADDITIONAL_SETTINGS[networkType] || {};
  });

  return {
    activeNetworkName,
    avalancheActiveNetworkSettings,
    avalancheActiveNetworkPredefinedSettings,
  };
}
