import { computed } from 'vue';
import type { NetworkTypeDefault } from '@/types';
import { NETWORK_TYPE_CUSTOM, NETWORK_TYPE_TESTNET, PROTOCOLS } from '@/constants';
import { useNetworks } from '@/composables/networks';
import { ETH_NETWORK_ADDITIONAL_SETTINGS } from '@/protocols/ethereum/config';

export function useEthNetworkSettings() {
  const { activeNetwork, activeNetworkName } = useNetworks();

  const ethActiveNetworkSettings = computed(
    () => activeNetwork.value.protocols[PROTOCOLS.ethereum] as any, // TODO - type ethereum network
  );

  const ethActiveNetworkPredefinedSettings = computed(
    (): any => { // TODO - type IEthNetworkPredefinedSettings network
      const networkType: NetworkTypeDefault = (activeNetwork.value.type === NETWORK_TYPE_CUSTOM)
        ? NETWORK_TYPE_TESTNET
        : activeNetwork.value.type;
      const additionalSettings = ETH_NETWORK_ADDITIONAL_SETTINGS[networkType];
      return additionalSettings || {};
    },
  );

  return {
    activeNetworkName,
    ethActiveNetworkSettings,
    ethActiveNetworkPredefinedSettings,
  };
}
