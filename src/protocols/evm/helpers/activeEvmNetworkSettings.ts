import type { Protocol } from '@/types';
import { PROTOCOLS } from '@/constants';
import { useEthNetworkSettings } from '@/protocols/ethereum/composables/ethNetworkSettings';
import { useBnbNetworkSettings } from '@/protocols/bnb/composables/bnbNetworkSettings';
import { useAvalancheNetworkSettings } from '@/protocols/avalanche/composables/avalancheNetworkSettings';
import { usePolygonNetworkSettings } from '@/protocols/polygonPos/composables/polygonPosNetworkSettings';

interface IActiveEvmNetworkSettings {
  chainId: string;
  nodeUrl: string;
  /** The Etherscan-like API */
  middlewareUrl: string;
}

/** The settings of an EVM chain on the active network */
export function getActiveEvmNetworkSettings(protocol: Protocol): IActiveEvmNetworkSettings {
  if (protocol === PROTOCOLS.bnb) {
    const {
      bnbActiveNetworkSettings,
      bnbActiveNetworkPredefinedSettings,
    } = useBnbNetworkSettings();
    return {
      chainId: bnbActiveNetworkSettings.value.chainId,
      nodeUrl: bnbActiveNetworkSettings.value.nodeUrl,
      middlewareUrl: bnbActiveNetworkPredefinedSettings.value.middlewareUrl,
    };
  }
  if (protocol === PROTOCOLS.avalanche) {
    const {
      avalancheActiveNetworkSettings,
      avalancheActiveNetworkPredefinedSettings,
    } = useAvalancheNetworkSettings();
    return {
      chainId: avalancheActiveNetworkSettings.value.chainId,
      nodeUrl: avalancheActiveNetworkSettings.value.nodeUrl,
      middlewareUrl: avalancheActiveNetworkPredefinedSettings.value.middlewareUrl,
    };
  }
  if (protocol === PROTOCOLS.polygonPos) {
    const {
      polygonActiveNetworkSettings,
      polygonActiveNetworkPredefinedSettings,
    } = usePolygonNetworkSettings();
    return {
      chainId: polygonActiveNetworkSettings.value.chainId,
      nodeUrl: polygonActiveNetworkSettings.value.nodeUrl,
      middlewareUrl: polygonActiveNetworkPredefinedSettings.value.middlewareUrl,
    };
  }
  const { ethActiveNetworkSettings, ethActiveNetworkPredefinedSettings } = useEthNetworkSettings();
  return {
    chainId: ethActiveNetworkSettings.value.chainId,
    nodeUrl: ethActiveNetworkSettings.value.nodeUrl,
    middlewareUrl: ethActiveNetworkPredefinedSettings.value.middlewareUrl,
  };
}
