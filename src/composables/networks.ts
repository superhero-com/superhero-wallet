import { computed, ref } from 'vue';
import type {
  INetwork,
  NetworkProtocolsSettings,
  NetworkTypeDefault,
} from '@/types';
import {
  NETWORK_NAME_MAINNET,
  NETWORK_NAME_TESTNET,
  NETWORK_TYPE_MAINNET,
  NETWORK_TYPE_TESTNET,
  PROTOCOL_LIST,
  STORAGE_KEYS,
} from '@/constants';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';
import { tg } from '@/popup/plugins/i18n';
import { useModals } from './modals';
import { useStorageRef } from './storageRef';

let initialized = false;

const defaultNetworks: INetwork[] = [];
const areNetworksRestored = ref(false);

/**
 * Networks added by the user by providing some custom URLs for each of the protocols.
 */
const customNetworks = useStorageRef<INetwork[]>(
  [],
  STORAGE_KEYS.customNetworks,
  { backgroundSync: true },
);

/**
 * As the network name is an unique string we are using it to differentiate the networks.
 */
const activeNetworkName = useStorageRef<string>(
  NETWORK_NAME_MAINNET,
  STORAGE_KEYS.activeNetworkName,
  {
    backgroundSync: true,
    onRestored: () => {
      areNetworksRestored.value = true;
    },
  },
);

const networks = computed(
  (): Record<string, INetwork> => [
    ...defaultNetworks,
    ...customNetworks.value,
  ].reduce((acc, network) => ({ ...acc, [network.name]: network }), {}),
);

const activeNetwork = computed(() => networks.value[activeNetworkName.value]);

function ensureDefaultNetworksExists() {
  if (defaultNetworks.length === 0) {
    const networkTypes: NetworkTypeDefault[] = [NETWORK_TYPE_MAINNET, NETWORK_TYPE_TESTNET];
    networkTypes.forEach((type) => {
      defaultNetworks.push({
        name: (type === NETWORK_TYPE_MAINNET) ? NETWORK_NAME_MAINNET : NETWORK_NAME_TESTNET,
        protocols: PROTOCOL_LIST.reduce((accumulator, protocol) => {
          // eslint-disable-next-line no-param-reassign
          accumulator[protocol] = ProtocolAdapterFactory.getAdapter(protocol)
            .getNetworkTypeDefaultValues(type);
          return accumulator;
        }, {} as NetworkProtocolsSettings),
        type,
      });
    });
  }
}

/**
 * Stores and manages of the user's network states.
 * This should not be confused with the `protocols`.
 */
export function useNetworks() {
  const { openConfirmModal } = useModals();

  function switchNetwork(name: string) {
    if (networks.value[name]) {
      activeNetworkName.value = name;
    } else {
      throw Error(`Could not switch to "${name}" network as it does not exist`);
    }
  }

  function addCustomNetwork(network: INetwork) {
    customNetworks.value.push(network);
  }

  function updateCustomNetwork(index: number, networkData: INetwork): boolean {
    if (customNetworks.value[index]) {
      customNetworks.value[index] = networkData;
      return true;
    }
    return false;
  }

  async function deleteCustomNetwork(name: string): Promise<boolean> {
    try {
      await openConfirmModal({ msg: tg('pages.network.confirmDelete') });

      const index = customNetworks.value.findIndex((network) => network.name === name);
      if (index > -1) {
        if (name === activeNetwork.value.name) {
          switchNetwork(NETWORK_NAME_MAINNET);
        }
        customNetworks.value.splice(index, 1);
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  function resetNetworks() {
    customNetworks.value = [];
    activeNetworkName.value = NETWORK_NAME_MAINNET;
  }

  if (!initialized) {
    ensureDefaultNetworksExists();
    if (!activeNetwork.value) {
      switchNetwork(NETWORK_NAME_MAINNET);
    }
    initialized = true;
  }

  return {
    areNetworksRestored,
    networks,
    customNetworks,
    defaultNetworks,
    activeNetwork,
    activeNetworkName,
    switchNetwork,
    addCustomNetwork,
    updateCustomNetwork,
    deleteCustomNetwork,
    resetNetworks,
  };
}

/**
 * Monitor the network state and compare it with stored custom state to know when
 * user changes the network.
 */
export function createNetworkWatcher() {
  // Delay the networks fill in to allow the protocol adapters to be created first
  setTimeout(() => {
    ensureDefaultNetworksExists();
  }, 0);

  let storedNetworkName: string;

  return {
    onNetworkChange: (callback: (newNetwork: INetwork, oldNetwork: INetwork) => void) => {
      setTimeout(() => {
        if (!storedNetworkName) {
          storedNetworkName = activeNetwork.value.name;
        } else if (storedNetworkName !== activeNetwork.value.name) {
          callback(activeNetwork.value, networks.value[storedNetworkName]);
          storedNetworkName = activeNetwork.value.name;
        }
      }, 0);
    },
  };
}
