import { computed } from 'vue';
import type { NetworkTypeDefault } from '@/types';
import {
  NETWORK_TYPE_CUSTOM,
  NETWORK_TYPE_TESTNET,
  PROTOCOLS,
} from '@/constants';
import { useNetworks } from '@/composables/networks';
import { BTC_NETWORK_ADDITIONAL_SETTINGS } from '@/protocols/bitcoin/config';

export function useBtcNetworkSettings() {
  const { activeNetwork, activeNetworkName } = useNetworks();

  const btcActiveNetworkSettings = computed(
    () => activeNetwork.value.protocols[PROTOCOLS.bitcoin] as any, // TODO - type btc network
  );

  const btcActiveNetworkPredefinedSettings = computed(
    (): any => { // TODO - type IBtcNetworkPredefinedSettings network
      const networkType: NetworkTypeDefault = (activeNetwork.value.type === NETWORK_TYPE_CUSTOM)
        ? NETWORK_TYPE_TESTNET
        : activeNetwork.value.type;
      return BTC_NETWORK_ADDITIONAL_SETTINGS[networkType] || {};
    },
  );

  return {
    activeNetworkName,
    btcActiveNetworkSettings,
    btcActiveNetworkPredefinedSettings,
  };
}
