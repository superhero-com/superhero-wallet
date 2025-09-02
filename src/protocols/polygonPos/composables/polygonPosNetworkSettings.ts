import { computed } from 'vue';
import type { NetworkTypeDefault } from '@/types';
import {
  NETWORK_TYPE_CUSTOM,
  NETWORK_TYPE_TESTNET,
  PROTOCOLS,
} from '@/constants';
import { useNetworks } from '@/composables/networks';
import { POLYGON_NETWORK_ADDITIONAL_SETTINGS } from '../config';

export function usePolygonNetworkSettings() {
  const { activeNetwork, activeNetworkName } = useNetworks();

  const polygonActiveNetworkSettings = computed(
    () => activeNetwork.value.protocols[PROTOCOLS.polygonPos] as any,
  );

  const polygonActiveNetworkPredefinedSettings = computed(() => {
    const networkType: NetworkTypeDefault = activeNetwork.value.type === NETWORK_TYPE_CUSTOM
      ? NETWORK_TYPE_TESTNET
      : activeNetwork.value.type;
    return POLYGON_NETWORK_ADDITIONAL_SETTINGS[networkType] || {};
  });

  return {
    activeNetworkName,
    polygonActiveNetworkSettings,
    polygonActiveNetworkPredefinedSettings,
  };
}
