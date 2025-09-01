import { computed } from 'vue';
import type { NetworkTypeDefault } from '@/types';
import {
  NETWORK_TYPE_CUSTOM,
  NETWORK_TYPE_TESTNET,
  PROTOCOLS,
} from '@/constants';
import { useNetworks } from '@/composables/networks';
import { BNB_NETWORK_ADDITIONAL_SETTINGS } from '../config';

export function useBnbNetworkSettings() {
  const { activeNetwork, activeNetworkName } = useNetworks();

  const bnbActiveNetworkSettings = computed(
    () => activeNetwork.value.protocols[PROTOCOLS.bnb] as any,
  );

  const bnbActiveNetworkPredefinedSettings = computed(() => {
    const networkType: NetworkTypeDefault = activeNetwork.value.type === NETWORK_TYPE_CUSTOM
      ? NETWORK_TYPE_TESTNET
      : activeNetwork.value.type;
    return BNB_NETWORK_ADDITIONAL_SETTINGS[networkType] || {};
  });

  return {
    activeNetworkName,
    bnbActiveNetworkSettings,
    bnbActiveNetworkPredefinedSettings,
  };
}
