import { computed } from 'vue';
import type { NetworkTypeDefault } from '@/types';
import { NETWORK_TYPE_CUSTOM, NETWORK_TYPE_TESTNET } from '@/constants';
import { useNetworks } from '@/composables/networks';
import type { IAeNetworkPredefinedSettings, IAeNetworkSettings } from '@/protocols/aeternity/types';
import { AE_NETWORK_ADDITIONAL_SETTINGS } from '@/protocols/aeternity/config';

export function useAeNetworkSettings() {
  const {
    activeNetwork,
    activeNetworkName,
    areNetworksRestored,
    onNetworkChange,
  } = useNetworks();

  const aeActiveNetworkSettings = computed(
    () => activeNetwork.value.protocols.aeternity as IAeNetworkSettings,
  );

  const aeActiveNetworkPredefinedSettings = computed(
    (): IAeNetworkPredefinedSettings => {
      const networkType: NetworkTypeDefault = (activeNetwork.value.type === NETWORK_TYPE_CUSTOM)
        ? NETWORK_TYPE_TESTNET
        : activeNetwork.value.type;
      const additionalSettings = AE_NETWORK_ADDITIONAL_SETTINGS[networkType];
      return additionalSettings || {};
    },
  );

  return {
    activeNetworkName,
    aeActiveNetworkSettings,
    aeActiveNetworkPredefinedSettings,
    areNetworksRestored,
    onNetworkChange,
  };
}
